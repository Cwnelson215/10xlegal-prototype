import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/connection.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { apiResponse, apiError, parsePagination, paginatedResponse } from '../utils/responses.js';
import { validate } from '../middleware/validate.js';
import { createCaseSchema, updateCaseSchema, assignJudgeSchema, assignAttorneySchema } from '../validation/schemas.js';
import { auditLog } from '../utils/audit.js';

const router = Router();

interface CaseRow {
  id: string;
  title: string;
  description: string;
  status: string;
  case_number: string;
  client_id: string;
  lawyer_id: string;
  court: string;
  prosecution_firm: string;
  prosecution_firm_id: string | null;
  defense_firm: string;
  defense_firm_id: string | null;
  judge_name: string;
  judge_id: string | null;
  charge: string;
  court_date: string;
  ruling: string;
  sentence: string;
  conviction_outcome: string;
  conviction_date: string;
  district_number: string;
  filing_date: string;
  disposition_date: string;
  case_type: string;
  offense_code: string;
  sentence_date: string;
  charges: string;
  judgment_description: string;
  sentence_description: string;
  created_at: string;
  updated_at: string;
}

interface CaseAttorneyRow {
  attorney_id: string;
  attorney_name: string;
  side: string;
}

async function getCaseAttorneys(db: any, caseId: string): Promise<CaseAttorneyRow[]> {
  const result = await db.query(
    'SELECT attorney_id, attorney_name, side FROM case_attorneys WHERE case_id = $1 ORDER BY created_at ASC',
    [caseId]
  );
  return result.rows as CaseAttorneyRow[];
}

function toCaseResponse(row: CaseRow, attorneys: CaseAttorneyRow[] = []) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    caseNumber: row.case_number,
    clientId: row.client_id,
    lawyerId: row.lawyer_id,
    court: row.court,
    prosecutionFirm: row.prosecution_firm,
    prosecutionFirmId: row.prosecution_firm_id,
    defenseFirm: row.defense_firm,
    defenseFirmId: row.defense_firm_id,
    judgeName: row.judge_name,
    judgeId: row.judge_id,
    prosecutionAttorneys: attorneys
      .filter((a) => a.side === 'prosecution')
      .map((a) => ({ id: a.attorney_id, name: a.attorney_name })),
    defenseAttorneys: attorneys
      .filter((a) => a.side === 'defense')
      .map((a) => ({ id: a.attorney_id, name: a.attorney_name })),
    charge: row.charge,
    courtDate: row.court_date,
    ruling: row.ruling,
    sentence: row.sentence,
    convictionOutcome: row.conviction_outcome,
    convictionDate: row.conviction_date,
    districtNumber: row.district_number,
    filingDate: row.filing_date,
    dispositionDate: row.disposition_date,
    caseType: row.case_type,
    offenseCode: row.offense_code,
    sentenceDate: row.sentence_date,
    judgmentDescription: row.judgment_description,
    sentenceDescription: row.sentence_description,
    charges: row.charges ? (() => { try { return JSON.parse(row.charges); } catch { return []; } })() : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /cases
router.get('/', optionalAuth, async (req, res) => {
  const { page, pageSize } = parsePagination(req.query as Record<string, unknown>);
  const offset = (page - 1) * pageSize;
  const db = getDb();

  const countResult = await db.query('SELECT COUNT(*)::int as count FROM cases');
  const total = countResult.rows[0]!.count as number;
  const rowsResult = await db.query('SELECT * FROM cases ORDER BY court_date DESC LIMIT $1 OFFSET $2', [pageSize, offset]);
  const rows = rowsResult.rows as CaseRow[];

  // Fetch all attorneys for the returned cases in one query
  const caseIds = rows.map((r) => r.id);
  let allAttorneys: CaseAttorneyRow[] = [];
  if (caseIds.length > 0) {
    const attResult = await db.query(
      'SELECT case_id, attorney_id, attorney_name, side FROM case_attorneys WHERE case_id = ANY($1) ORDER BY created_at ASC',
      [caseIds]
    );
    allAttorneys = attResult.rows as (CaseAttorneyRow & { case_id: string })[];
  }

  const data = rows.map((row) => {
    const caseAttorneys = allAttorneys.filter((a: any) => a.case_id === row.id);
    return toCaseResponse(row, caseAttorneys);
  });

  paginatedResponse(res, data, total, page, pageSize);
});

// POST /cases
router.post('/', authenticate, validate(createCaseSchema), async (req, res) => {
  const { title, description, caseNumber, clientId, lawyerId } = req.body;
  const db = getDb();

  const id = uuidv4();
  const now = new Date().toISOString();

  await db.query(`
    INSERT INTO cases (id, title, description, case_number, client_id, lawyer_id, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [id, title, description || '', caseNumber, clientId, lawyerId || '', now, now]);

  const result = await db.query('SELECT * FROM cases WHERE id = $1', [id]);
  const row = result.rows[0] as CaseRow;
  auditLog('case_create', { userId: req.user!.id, userName: req.user!.name }, `Created case ${caseNumber}`);
  apiResponse(res, toCaseResponse(row, []), 201);
});

// GET /cases/:id
router.get('/:id', optionalAuth, async (req, res) => {
  const db = getDb();
  const result = await db.query('SELECT * FROM cases WHERE id = $1', [req.params.id]);
  const row = result.rows[0] as CaseRow | undefined;
  if (!row) {
    apiError(res, 'Case not found', 404);
    return;
  }
  const attorneys = await getCaseAttorneys(db, row.id);
  apiResponse(res, toCaseResponse(row, attorneys));
});

// PUT /cases/:id
router.put('/:id', authenticate, validate(updateCaseSchema), async (req, res) => {
  const db = getDb();
  const existingResult = await db.query('SELECT * FROM cases WHERE id = $1', [req.params.id]);
  const existing = existingResult.rows[0] as CaseRow | undefined;
  if (!existing) {
    apiError(res, 'Case not found', 404);
    return;
  }

  const { title, description, status, lawyerId } = req.body;
  const now = new Date().toISOString();
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIdx = 1;

  if (title !== undefined) { updates.push(`title = $${paramIdx++}`); values.push(title); }
  if (description !== undefined) { updates.push(`description = $${paramIdx++}`); values.push(description); }
  if (status !== undefined) { updates.push(`status = $${paramIdx++}`); values.push(status); }
  if (lawyerId !== undefined) { updates.push(`lawyer_id = $${paramIdx++}`); values.push(lawyerId); }

  if (updates.length === 0) {
    apiResponse(res, toCaseResponse(existing));
    return;
  }

  updates.push(`updated_at = $${paramIdx++}`);
  values.push(now);
  values.push(req.params.id);

  await db.query(`UPDATE cases SET ${updates.join(', ')} WHERE id = $${paramIdx}`, values);

  const caseId = req.params.id as string;
  const result = await db.query('SELECT * FROM cases WHERE id = $1', [caseId]);
  const row = result.rows[0] as CaseRow;
  const caseAttorneys = await getCaseAttorneys(db, caseId);
  auditLog('case_update', { userId: req.user!.id, userName: req.user!.name }, `Updated case ${caseId}`);
  apiResponse(res, toCaseResponse(row, caseAttorneys));
});

// DELETE /cases/:id
router.delete('/:id', authenticate, async (req, res) => {
  const db = getDb();
  const existingResult = await db.query('SELECT id FROM cases WHERE id = $1', [req.params.id]);
  if (!existingResult.rows[0]) {
    apiError(res, 'Case not found', 404);
    return;
  }

  await db.query('DELETE FROM cases WHERE id = $1', [req.params.id]);
  auditLog('case_delete', { userId: req.user!.id, userName: req.user!.name }, `Deleted case ${req.params.id}`);
  apiResponse(res, null);
});

// PUT /cases/:id/judge
router.put('/:id/judge', authenticate, validate(assignJudgeSchema), async (req: any, res) => {
  if (req.user.role !== 'admin') {
    apiError(res, 'Admin access required', 403);
    return;
  }

  const db = getDb();
  const caseResult = await db.query('SELECT id, case_number FROM cases WHERE id = $1', [req.params.id]);
  if (!caseResult.rows[0]) {
    apiError(res, 'Case not found', 404);
    return;
  }

  const { judgeId } = req.body;
  const judgeResult = await db.query('SELECT id, name FROM judges WHERE id = $1', [judgeId]);
  if (!judgeResult.rows[0]) {
    apiError(res, 'Judge not found', 404);
    return;
  }

  const judgeName = (judgeResult.rows[0] as any).name;
  await db.query(
    'UPDATE cases SET judge_id = $1, judge_name = $2, updated_at = NOW() WHERE id = $3',
    [judgeId, judgeName, req.params.id]
  );

  const result = await db.query('SELECT * FROM cases WHERE id = $1', [req.params.id]);
  const row = result.rows[0] as CaseRow;
  const caseAttorneys = await getCaseAttorneys(db, req.params.id);
  const caseNumber = (caseResult.rows[0] as any).case_number;
  auditLog('judge_assign', { userId: req.user.id, userName: req.user.name }, `Assigned Judge ${judgeName} to case ${caseNumber}`);
  apiResponse(res, toCaseResponse(row, caseAttorneys));
});

// PUT /cases/:id/attorneys — add attorney to case
router.put('/:id/attorneys', authenticate, validate(assignAttorneySchema), async (req: any, res) => {
  if (req.user.role !== 'admin') {
    apiError(res, 'Admin access required', 403);
    return;
  }

  const db = getDb();
  const caseResult = await db.query('SELECT id, case_number FROM cases WHERE id = $1', [req.params.id]);
  if (!caseResult.rows[0]) {
    apiError(res, 'Case not found', 404);
    return;
  }

  const { side, attorneyId } = req.body;
  const attorneyResult = await db.query('SELECT id, name FROM attorneys WHERE id = $1', [attorneyId]);
  if (!attorneyResult.rows[0]) {
    apiError(res, 'Attorney not found', 404);
    return;
  }

  const attorneyName = (attorneyResult.rows[0] as any).name;

  await db.query(
    `INSERT INTO case_attorneys (id, case_id, attorney_id, side, attorney_name, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (case_id, attorney_id) DO NOTHING`,
    [uuidv4(), req.params.id, attorneyId, side, attorneyName]
  );

  await db.query('UPDATE cases SET updated_at = NOW() WHERE id = $1', [req.params.id]);

  const result = await db.query('SELECT * FROM cases WHERE id = $1', [req.params.id]);
  const row = result.rows[0] as CaseRow;
  const caseAttorneys = await getCaseAttorneys(db, req.params.id);
  const caseNumber = (caseResult.rows[0] as any).case_number;
  auditLog('attorney_assign', { userId: req.user.id, userName: req.user.name }, `Assigned ${side} attorney ${attorneyName} to case ${caseNumber}`);
  apiResponse(res, toCaseResponse(row, caseAttorneys));
});

// DELETE /cases/:id/attorneys/:attorneyId — remove attorney from case
router.delete('/:id/attorneys/:attorneyId', authenticate, async (req: any, res) => {
  if (req.user.role !== 'admin') {
    apiError(res, 'Admin access required', 403);
    return;
  }

  const db = getDb();
  const caseResult = await db.query('SELECT id, case_number FROM cases WHERE id = $1', [req.params.id]);
  if (!caseResult.rows[0]) {
    apiError(res, 'Case not found', 404);
    return;
  }

  const deleteResult = await db.query(
    'DELETE FROM case_attorneys WHERE case_id = $1 AND attorney_id = $2 RETURNING attorney_name',
    [req.params.id, req.params.attorneyId]
  );

  if (!deleteResult.rows[0]) {
    apiError(res, 'Attorney not assigned to this case', 404);
    return;
  }

  await db.query('UPDATE cases SET updated_at = NOW() WHERE id = $1', [req.params.id]);

  const result = await db.query('SELECT * FROM cases WHERE id = $1', [req.params.id]);
  const row = result.rows[0] as CaseRow;
  const caseAttorneys = await getCaseAttorneys(db, req.params.id);
  const caseNumber = (caseResult.rows[0] as any).case_number;
  const attorneyName = (deleteResult.rows[0] as any).attorney_name;
  auditLog('attorney_unassign', { userId: req.user.id, userName: req.user.name }, `Removed attorney ${attorneyName} from case ${caseNumber}`);
  apiResponse(res, toCaseResponse(row, caseAttorneys));
});

export { router as casesRoutes };
