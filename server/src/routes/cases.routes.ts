import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/connection.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { apiResponse, apiError, parsePagination, paginatedResponse } from '../utils/responses.js';
import { validate } from '../middleware/validate.js';
import { createCaseSchema, updateCaseSchema } from '../validation/schemas.js';

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
  prosecution_attorney: string;
  prosecution_attorney_id: string | null;
  prosecution_firm: string;
  prosecution_firm_id: string | null;
  defense_attorney: string;
  defense_attorney_id: string | null;
  defense_firm: string;
  defense_firm_id: string | null;
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

function toCaseResponse(row: CaseRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    caseNumber: row.case_number,
    clientId: row.client_id,
    lawyerId: row.lawyer_id,
    court: row.court,
    prosecutionAttorney: row.prosecution_attorney,
    prosecutionAttorneyId: row.prosecution_attorney_id,
    prosecutionFirm: row.prosecution_firm,
    prosecutionFirmId: row.prosecution_firm_id,
    defenseAttorney: row.defense_attorney,
    defenseAttorneyId: row.defense_attorney_id,
    defenseFirm: row.defense_firm,
    defenseFirmId: row.defense_firm_id,
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

  paginatedResponse(res, rows.map(toCaseResponse), total, page, pageSize);
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
  apiResponse(res, toCaseResponse(row), 201);
});

// GET /cases/:id
router.get('/:id', optionalAuth, async (req, res) => {
  const result = await getDb().query('SELECT * FROM cases WHERE id = $1', [req.params.id]);
  const row = result.rows[0] as CaseRow | undefined;
  if (!row) {
    apiError(res, 'Case not found', 404);
    return;
  }
  apiResponse(res, toCaseResponse(row));
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

  const result = await db.query('SELECT * FROM cases WHERE id = $1', [req.params.id]);
  const row = result.rows[0] as CaseRow;
  apiResponse(res, toCaseResponse(row));
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
  apiResponse(res, null);
});

export { router as casesRoutes };
