import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/connection.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { apiResponse, apiError, parsePagination, paginatedResponse } from '../utils/responses.js';
import { validate } from '../middleware/validate.js';
import { createAttorneySchema } from '../validation/schemas.js';
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
            CASE WHEN a.type = 'prosecution'
              THEN (SELECT COUNT(*)::int FROM cases WHERE prosecution_attorney_id = a.id)
              ELSE (SELECT COUNT(*)::int FROM cases WHERE defense_attorney_id = a.id)
            END AS case_count
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
            CASE WHEN a.type = 'prosecution'
              THEN (SELECT COUNT(*)::int FROM cases WHERE prosecution_attorney_id = a.id)
              ELSE (SELECT COUNT(*)::int FROM cases WHERE defense_attorney_id = a.id)
            END AS case_count
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

export { router as attorneysRoutes };
