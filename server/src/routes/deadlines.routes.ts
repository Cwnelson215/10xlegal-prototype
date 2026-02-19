import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/connection.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { apiResponse, apiError, parsePagination, paginatedResponse } from '../utils/responses.js';
import { validate } from '../middleware/validate.js';
import { createDeadlineSchema, updateDeadlineSchema } from '../validation/schemas.js';

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
router.get('/', optionalAuth, (req, res) => {
  const { page, pageSize } = parsePagination(req.query as Record<string, unknown>);
  const offset = (page - 1) * pageSize;
  const caseId = req.query.caseId as string | undefined;

  let whereClause = '';
  const params: unknown[] = [];

  if (caseId) {
    whereClause = 'WHERE case_id = ?';
    params.push(caseId);
  }

  const countRow = getDb().prepare(`SELECT COUNT(*) as count FROM deadlines ${whereClause}`).get(...params) as { count: number };
  const rows = getDb().prepare(`SELECT * FROM deadlines ${whereClause} ORDER BY due_date ASC LIMIT ? OFFSET ?`).all(...params, pageSize, offset) as DeadlineRow[];

  paginatedResponse(res, rows.map(toDeadlineResponse), countRow.count, page, pageSize);
});

// POST /deadlines
router.post('/', authenticate, validate(createDeadlineSchema), (req, res) => {
  const { title, description, dueDate, caseId, assignedTo } = req.body;

  const id = uuidv4();
  const now = new Date().toISOString();

  getDb().prepare(`
    INSERT INTO deadlines (id, title, description, due_date, case_id, assigned_to, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `).run(id, title, description || '', dueDate, caseId, assignedTo || '', now, now);

  const row = getDb().prepare('SELECT * FROM deadlines WHERE id = ?').get(id) as DeadlineRow;
  apiResponse(res, toDeadlineResponse(row), 201);
});

// GET /deadlines/:id
router.get('/:id', optionalAuth, (req, res) => {
  const row = getDb().prepare('SELECT * FROM deadlines WHERE id = ?').get(req.params.id) as DeadlineRow | undefined;
  if (!row) {
    apiError(res, 'Deadline not found', 404);
    return;
  }
  apiResponse(res, toDeadlineResponse(row));
});

// PUT /deadlines/:id
router.put('/:id', authenticate, validate(updateDeadlineSchema), (req, res) => {
  const existing = getDb().prepare('SELECT * FROM deadlines WHERE id = ?').get(req.params.id) as DeadlineRow | undefined;
  if (!existing) {
    apiError(res, 'Deadline not found', 404);
    return;
  }

  const { title, description, dueDate, status, assignedTo } = req.body;
  const now = new Date().toISOString();
  const updates: string[] = [];
  const values: unknown[] = [];

  if (title !== undefined) { updates.push('title = ?'); values.push(title); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  if (dueDate !== undefined) { updates.push('due_date = ?'); values.push(dueDate); }
  if (status !== undefined) { updates.push('status = ?'); values.push(status); }
  if (assignedTo !== undefined) { updates.push('assigned_to = ?'); values.push(assignedTo); }

  if (updates.length === 0) {
    apiResponse(res, toDeadlineResponse(existing));
    return;
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(req.params.id);

  getDb().prepare(`UPDATE deadlines SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const row = getDb().prepare('SELECT * FROM deadlines WHERE id = ?').get(req.params.id) as DeadlineRow;
  apiResponse(res, toDeadlineResponse(row));
});

// DELETE /deadlines/:id
router.delete('/:id', authenticate, (req, res) => {
  const existing = getDb().prepare('SELECT id FROM deadlines WHERE id = ?').get(req.params.id);
  if (!existing) {
    apiError(res, 'Deadline not found', 404);
    return;
  }

  getDb().prepare('DELETE FROM deadlines WHERE id = ?').run(req.params.id);
  apiResponse(res, null);
});

export { router as deadlinesRoutes };
