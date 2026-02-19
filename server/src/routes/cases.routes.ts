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
  county: string;
  judge: string;
  judge_id: string | null;
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
    county: row.county,
    judge: row.judge,
    judgeId: row.judge_id,
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /cases
router.get('/', optionalAuth, (req, res) => {
  const { page, pageSize } = parsePagination(req.query as Record<string, unknown>);
  const offset = (page - 1) * pageSize;

  const total = (getDb().prepare('SELECT COUNT(*) as count FROM cases').get() as { count: number }).count;
  const rows = getDb().prepare('SELECT * FROM cases ORDER BY court_date DESC LIMIT ? OFFSET ?').all(pageSize, offset) as CaseRow[];

  paginatedResponse(res, rows.map(toCaseResponse), total, page, pageSize);
});

// POST /cases
router.post('/', authenticate, validate(createCaseSchema), (req, res) => {
  const { title, description, caseNumber, clientId, lawyerId } = req.body;

  const id = uuidv4();
  const now = new Date().toISOString();

  getDb().prepare(`
    INSERT INTO cases (id, title, description, case_number, client_id, lawyer_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, description || '', caseNumber, clientId, lawyerId || '', now, now);

  const row = getDb().prepare('SELECT * FROM cases WHERE id = ?').get(id) as CaseRow;
  apiResponse(res, toCaseResponse(row), 201);
});

// GET /cases/:id
router.get('/:id', optionalAuth, (req, res) => {
  const row = getDb().prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id) as CaseRow | undefined;
  if (!row) {
    apiError(res, 'Case not found', 404);
    return;
  }
  apiResponse(res, toCaseResponse(row));
});

// PUT /cases/:id
router.put('/:id', authenticate, validate(updateCaseSchema), (req, res) => {
  const existing = getDb().prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id) as CaseRow | undefined;
  if (!existing) {
    apiError(res, 'Case not found', 404);
    return;
  }

  const { title, description, status, lawyerId } = req.body;
  const now = new Date().toISOString();
  const updates: string[] = [];
  const values: unknown[] = [];

  if (title !== undefined) { updates.push('title = ?'); values.push(title); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  if (status !== undefined) { updates.push('status = ?'); values.push(status); }
  if (lawyerId !== undefined) { updates.push('lawyer_id = ?'); values.push(lawyerId); }

  if (updates.length === 0) {
    apiResponse(res, toCaseResponse(existing));
    return;
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(req.params.id);

  getDb().prepare(`UPDATE cases SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const row = getDb().prepare('SELECT * FROM cases WHERE id = ?').get(req.params.id) as CaseRow;
  apiResponse(res, toCaseResponse(row));
});

// DELETE /cases/:id
router.delete('/:id', authenticate, (req, res) => {
  const existing = getDb().prepare('SELECT id FROM cases WHERE id = ?').get(req.params.id);
  if (!existing) {
    apiError(res, 'Case not found', 404);
    return;
  }

  getDb().prepare('DELETE FROM cases WHERE id = ?').run(req.params.id);
  apiResponse(res, null);
});

export { router as casesRoutes };
