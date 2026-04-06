import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/connection.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { apiResponse, apiError, parsePagination, paginatedResponse } from '../utils/responses.js';
import { validate } from '../middleware/validate.js';
import { createJudgeSchema } from '../validation/schemas.js';
import { auditLog } from '../utils/audit.js';

const router = Router();

// GET /judges
router.get('/', optionalAuth, async (req, res) => {
  const { page, pageSize } = parsePagination(req.query as Record<string, unknown>);
  const offset = (page - 1) * pageSize;
  const court = req.query.court as string | undefined;
  const db = getDb();

  let whereClause = '';
  const countParams: unknown[] = [];
  const rowParams: unknown[] = [];
  let paramIdx = 1;

  if (court) {
    whereClause = `WHERE j.court = $${paramIdx++}`;
    countParams.push(court);
    rowParams.push(court);
  }

  const countResult = await db.query(
    `SELECT COUNT(*)::int as count FROM judges j ${whereClause}`,
    countParams
  );
  const total = countResult.rows[0]!.count as number;

  rowParams.push(pageSize, offset);
  const rowsResult = await db.query(
    `SELECT j.id, j.name, j.title, j.court, j.district, j.created_at, j.updated_at,
            (SELECT COUNT(*)::int FROM cases WHERE judge_id = j.id) AS case_count
     FROM judges j
     ${whereClause}
     ORDER BY j.name ASC
     LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
    rowParams
  );

  const data = rowsResult.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    title: row.title,
    court: row.court,
    district: row.district,
    caseCount: row.case_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  paginatedResponse(res, data, total, page, pageSize);
});

// GET /judges/:id
router.get('/:id', optionalAuth, async (req, res) => {
  const db = getDb();
  const result = await db.query(
    `SELECT j.id, j.name, j.title, j.court, j.district, j.created_at, j.updated_at,
            (SELECT COUNT(*)::int FROM cases WHERE judge_id = j.id) AS case_count
     FROM judges j
     WHERE j.id = $1`,
    [req.params.id]
  );
  const row = result.rows[0] as any | undefined;
  if (!row) {
    apiError(res, 'Judge not found', 404);
    return;
  }
  apiResponse(res, {
    id: row.id,
    name: row.name,
    title: row.title,
    court: row.court,
    district: row.district,
    caseCount: row.case_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
});

// POST /judges
router.post('/', authenticate, validate(createJudgeSchema), async (req: any, res) => {
  if (req.user.role !== 'admin') {
    apiError(res, 'Admin access required', 403);
    return;
  }

  const { name, title, court, district } = req.body;
  const db = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  await db.query(
    `INSERT INTO judges (id, name, title, court, district, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, name, title || '', court || '', district || '', now, now]
  );

  await auditLog('judge_create', { userId: req.user.id, userName: req.user.name }, `Created judge: ${name}`);

  apiResponse(res, {
    id,
    name,
    title: title || '',
    court: court || '',
    district: district || '',
    caseCount: 0,
    createdAt: now,
    updatedAt: now,
  }, 201);
});

export { router as judgesRoutes };
