import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { optionalAuth } from '../middleware/auth.js';
import { apiResponse, apiError, parsePagination, paginatedResponse } from '../utils/responses.js';

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

export { router as attorneysRoutes };
