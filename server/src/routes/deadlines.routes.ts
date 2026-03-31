import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/connection.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { apiResponse, apiError, parsePagination, paginatedResponse } from '../utils/responses.js';
import { validate } from '../middleware/validate.js';
import { createDeadlineSchema, updateDeadlineSchema } from '../validation/schemas.js';
import { auditLog } from '../utils/audit.js';

const router = Router();

interface DeadlineRow {
  id: string;
  title: string;
  description: string;
  due_date: string;
  case_id: string;
  case_number: string;
  assigned_to: string;
  status: string;
  client_id: string;
  created_at: string;
  updated_at: string;
}

function toDeadlineResponse(row: DeadlineRow) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    caseId: row.case_id,
    caseNumber: row.case_number,
    assignedTo: row.assigned_to,
    status: row.status,
    clientId: row.client_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /deadlines
router.get('/', optionalAuth, async (req, res) => {
  const { page, pageSize } = parsePagination(req.query as Record<string, unknown>);
  const offset = (page - 1) * pageSize;
  const caseId = req.query.caseId as string | undefined;
  const db = getDb();

  let whereClause = '';
  const countParams: unknown[] = [];
  const rowParams: unknown[] = [];
  let paramIdx = 1;

  if (caseId) {
    whereClause = `WHERE case_id = $${paramIdx++}`;
    countParams.push(caseId);
    rowParams.push(caseId);
  }

  const countResult = await db.query(`SELECT COUNT(*)::int as count FROM deadlines ${whereClause}`, countParams);
  const total = countResult.rows[0]!.count as number;

  rowParams.push(pageSize, offset);
  const rowsResult = await db.query(
    `SELECT * FROM deadlines ${whereClause} ORDER BY due_date ASC LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
    rowParams
  );
  const rows = rowsResult.rows as DeadlineRow[];

  paginatedResponse(res, rows.map(toDeadlineResponse), total, page, pageSize);
});

// POST /deadlines
router.post('/', authenticate, validate(createDeadlineSchema), async (req, res) => {
  const { title, description, dueDate, caseId, assignedTo } = req.body;
  const db = getDb();

  const id = uuidv4();
  const now = new Date().toISOString();

  await db.query(`
    INSERT INTO deadlines (id, title, description, due_date, case_id, assigned_to, status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8)
  `, [id, title, description || '', dueDate, caseId, assignedTo || '', now, now]);

  const result = await db.query('SELECT * FROM deadlines WHERE id = $1', [id]);
  const row = result.rows[0] as DeadlineRow;
  auditLog('deadline_create', { userId: req.user!.id, userName: req.user!.name }, `Created deadline "${title}"`);
  apiResponse(res, toDeadlineResponse(row), 201);
});

// GET /deadlines/:id
router.get('/:id', optionalAuth, async (req, res) => {
  const result = await getDb().query('SELECT * FROM deadlines WHERE id = $1', [req.params.id]);
  const row = result.rows[0] as DeadlineRow | undefined;
  if (!row) {
    apiError(res, 'Deadline not found', 404);
    return;
  }
  apiResponse(res, toDeadlineResponse(row));
});

// PUT /deadlines/:id
router.put('/:id', authenticate, validate(updateDeadlineSchema), async (req, res) => {
  const db = getDb();
  const existingResult = await db.query('SELECT * FROM deadlines WHERE id = $1', [req.params.id]);
  const existing = existingResult.rows[0] as DeadlineRow | undefined;
  if (!existing) {
    apiError(res, 'Deadline not found', 404);
    return;
  }

  const { title, description, dueDate, status, assignedTo } = req.body;
  const now = new Date().toISOString();
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIdx = 1;

  if (title !== undefined) { updates.push(`title = $${paramIdx++}`); values.push(title); }
  if (description !== undefined) { updates.push(`description = $${paramIdx++}`); values.push(description); }
  if (dueDate !== undefined) { updates.push(`due_date = $${paramIdx++}`); values.push(dueDate); }
  if (status !== undefined) { updates.push(`status = $${paramIdx++}`); values.push(status); }
  if (assignedTo !== undefined) { updates.push(`assigned_to = $${paramIdx++}`); values.push(assignedTo); }

  if (updates.length === 0) {
    apiResponse(res, toDeadlineResponse(existing));
    return;
  }

  updates.push(`updated_at = $${paramIdx++}`);
  values.push(now);
  values.push(req.params.id);

  await db.query(`UPDATE deadlines SET ${updates.join(', ')} WHERE id = $${paramIdx}`, values);

  const result = await db.query('SELECT * FROM deadlines WHERE id = $1', [req.params.id]);
  const row = result.rows[0] as DeadlineRow;
  auditLog('deadline_update', { userId: req.user!.id, userName: req.user!.name }, `Updated deadline ${req.params.id}`);
  apiResponse(res, toDeadlineResponse(row));
});

// DELETE /deadlines/:id
router.delete('/:id', authenticate, async (req, res) => {
  const db = getDb();
  const existingResult = await db.query('SELECT id FROM deadlines WHERE id = $1', [req.params.id]);
  if (!existingResult.rows[0]) {
    apiError(res, 'Deadline not found', 404);
    return;
  }

  await db.query('DELETE FROM deadlines WHERE id = $1', [req.params.id]);
  auditLog('deadline_delete', { userId: req.user!.id, userName: req.user!.name }, `Deleted deadline ${req.params.id}`);
  apiResponse(res, null);
});

export { router as deadlinesRoutes };
