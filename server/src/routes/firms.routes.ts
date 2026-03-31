import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { optionalAuth } from '../middleware/auth.js';
import { apiResponse, apiError, parsePagination, paginatedResponse } from '../utils/responses.js';

const router = Router();

// GET /firms
router.get('/', optionalAuth, async (req, res) => {
  const { page, pageSize } = parsePagination(req.query as Record<string, unknown>);
  const offset = (page - 1) * pageSize;
  const db = getDb();

  const countResult = await db.query('SELECT COUNT(*)::int as count FROM law_firms');
  const total = countResult.rows[0]!.count as number;

  const rowsResult = await db.query(
    `SELECT f.id, f.name, f.type, f.created_at, f.updated_at,
            (SELECT COUNT(*)::int FROM attorneys WHERE firm_id = f.id) AS attorney_count,
            (SELECT COUNT(*)::int FROM cases WHERE prosecution_firm_id = f.id)
              + (SELECT COUNT(*)::int FROM cases WHERE defense_firm_id = f.id) AS case_count
     FROM law_firms f
     ORDER BY f.name ASC
     LIMIT $1 OFFSET $2`,
    [pageSize, offset]
  );

  const data = rowsResult.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    type: row.type || null,
    attorneyCount: row.attorney_count,
    caseCount: row.case_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  paginatedResponse(res, data, total, page, pageSize);
});

// GET /firms/:id
router.get('/:id', optionalAuth, async (req, res) => {
  const db = getDb();
  const result = await db.query(
    `SELECT f.id, f.name, f.type, f.created_at, f.updated_at,
            (SELECT COUNT(*)::int FROM attorneys WHERE firm_id = f.id) AS attorney_count,
            (SELECT COUNT(*)::int FROM cases WHERE prosecution_firm_id = f.id)
              + (SELECT COUNT(*)::int FROM cases WHERE defense_firm_id = f.id) AS case_count
     FROM law_firms f
     WHERE f.id = $1`,
    [req.params.id]
  );
  const row = result.rows[0] as any | undefined;
  if (!row) {
    apiError(res, 'Firm not found', 404);
    return;
  }

  const attorneysResult = await db.query(
    'SELECT id, name, type FROM attorneys WHERE firm_id = $1 ORDER BY name ASC',
    [row.id]
  );

  apiResponse(res, {
    id: row.id,
    name: row.name,
    type: row.type || null,
    attorneyCount: row.attorney_count,
    caseCount: row.case_count,
    attorneys: attorneysResult.rows,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
});

export { router as firmsRoutes };
