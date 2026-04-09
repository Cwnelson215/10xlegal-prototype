import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/connection.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { apiResponse, apiError, parsePagination, paginatedResponse } from '../utils/responses.js';
import { validate } from '../middleware/validate.js';
import { createAttorneySchema, updateAttorneySchema } from '../validation/schemas.js';
import { auditLog } from '../utils/audit.js';

const router = Router();

// GET /attorneys
router.get('/', optionalAuth, async (req, res) => {
  const { page, pageSize } = parsePagination(req.query as Record<string, unknown>);
  const offset = (page - 1) * pageSize;
  const type = req.query.type as string | undefined;
  const db = getDb();

  let whereClause = '';
  const countParams: unknown[] = [];
  const rowParams: unknown[] = [];
  let paramIdx = 1;

  if (type === 'prosecution' || type === 'defense') {
    whereClause = `WHERE a.type = $${paramIdx++}`;
    countParams.push(type);
    rowParams.push(type);
  }

  const countResult = await db.query(
    `SELECT COUNT(*)::int as count FROM attorneys a ${whereClause}`,
    countParams
  );
  const total = countResult.rows[0]!.count as number;

  rowParams.push(pageSize, offset);
  const rowsResult = await db.query(
    `SELECT a.id, a.name, a.type, a.firm_id, a.created_at, a.updated_at,
            lf.name AS firm_name,
            (SELECT COUNT(*)::int FROM case_attorneys WHERE attorney_id = a.id) AS case_count
     FROM attorneys a
     LEFT JOIN law_firms lf ON lf.id = a.firm_id
     ${whereClause}
     ORDER BY a.name ASC
     LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
    rowParams
  );

  const data = rowsResult.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    firmId: row.firm_id,
    firmName: row.firm_name ?? null,
    caseCount: row.case_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  paginatedResponse(res, data, total, page, pageSize);
});

// GET /attorneys/:id
router.get('/:id', optionalAuth, async (req, res) => {
  const db = getDb();
  const result = await db.query(
    `SELECT a.id, a.name, a.type, a.firm_id, a.created_at, a.updated_at,
            lf.name AS firm_name,
            (SELECT COUNT(*)::int FROM case_attorneys WHERE attorney_id = a.id) AS case_count
     FROM attorneys a
     LEFT JOIN law_firms lf ON lf.id = a.firm_id
     WHERE a.id = $1`,
    [req.params.id]
  );
  const row = result.rows[0] as any | undefined;
  if (!row) {
    apiError(res, 'Attorney not found', 404);
    return;
  }
  apiResponse(res, {
    id: row.id,
    name: row.name,
    type: row.type,
    firmId: row.firm_id,
    firmName: row.firm_name ?? null,
    caseCount: row.case_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
});

// POST /attorneys
router.post('/', authenticate, validate(createAttorneySchema), async (req: any, res) => {
  if (req.user.role !== 'admin') {
    apiError(res, 'Admin access required', 403);
    return;
  }

  const db = getDb();
  const { name, type, firmId } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();

  await db.query(
    `INSERT INTO attorneys (id, name, type, firm_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (name, type) DO UPDATE SET updated_at = $6 RETURNING id`,
    [id, name.trim(), type, firmId || null, now, now]
  );

  const result = await db.query(
    `SELECT a.id, a.name, a.type, a.firm_id, a.created_at, a.updated_at,
            lf.name AS firm_name,
            0 AS case_count
     FROM attorneys a
     LEFT JOIN law_firms lf ON lf.id = a.firm_id
     WHERE a.name = $1 AND a.type = $2`,
    [name.trim(), type]
  );
  const row = result.rows[0] as any;

  auditLog('attorney_create', { userId: req.user.id, userName: req.user.name }, `Created ${type} attorney ${name}`);
  apiResponse(res, {
    id: row.id,
    name: row.name,
    type: row.type,
    firmId: row.firm_id,
    firmName: row.firm_name ?? null,
    caseCount: row.case_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }, 201);
});

// PUT /attorneys/:id
router.put('/:id', authenticate, validate(updateAttorneySchema), async (req: any, res) => {
  if (req.user.role !== 'admin') {
    apiError(res, 'Admin access required', 403);
    return;
  }

  const db = getDb();
  const existing = await db.query('SELECT id, name FROM attorneys WHERE id = $1', [req.params.id]);
  if (!existing.rows[0]) {
    apiError(res, 'Attorney not found', 404);
    return;
  }

  const { name, type, firmId } = req.body;
  const updates: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name.trim()); }
  if (type !== undefined) { updates.push(`type = $${idx++}`); values.push(type); }
  if (firmId !== undefined) { updates.push(`firm_id = $${idx++}`); values.push(firmId); }

  if (updates.length === 0) {
    apiError(res, 'No fields to update', 400);
    return;
  }

  updates.push(`updated_at = $${idx++}`);
  values.push(new Date().toISOString());
  values.push(req.params.id);

  await db.query(
    `UPDATE attorneys SET ${updates.join(', ')} WHERE id = $${idx}`,
    values
  );

  // Update denormalized name in case_attorneys junction table
  if (name !== undefined) {
    await db.query(
      'UPDATE case_attorneys SET attorney_name = $1 WHERE attorney_id = $2',
      [name.trim(), req.params.id]
    );
  }

  const result = await db.query(
    `SELECT a.id, a.name, a.type, a.firm_id, a.created_at, a.updated_at,
            lf.name AS firm_name,
            (SELECT COUNT(*)::int FROM case_attorneys WHERE attorney_id = a.id) AS case_count
     FROM attorneys a
     LEFT JOIN law_firms lf ON lf.id = a.firm_id
     WHERE a.id = $1`,
    [req.params.id]
  );
  const row = result.rows[0] as any;

  auditLog('attorney_update', { userId: req.user.id, userName: req.user.name }, `Updated attorney ${row.name}`);
  apiResponse(res, {
    id: row.id,
    name: row.name,
    type: row.type,
    firmId: row.firm_id,
    firmName: row.firm_name ?? null,
    caseCount: row.case_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
});

export { router as attorneysRoutes };
