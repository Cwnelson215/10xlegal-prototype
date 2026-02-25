import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { optionalAuth } from '../middleware/auth.js';
import { apiResponse, apiError, parsePagination, paginatedResponse } from '../utils/responses.js';

const router = Router();

interface AttorneyRow {
  id: string;
  name: string;
  type: string;
  firm_id: string | null;
  created_at: string;
  updated_at: string;
}

async function toAttorneyResponse(row: AttorneyRow) {
  const db = getDb();

  let firmName: string | null = null;
  if (row.firm_id) {
    const firmResult = await db.query('SELECT name FROM law_firms WHERE id = $1', [row.firm_id]);
    const firm = firmResult.rows[0] as { name: string } | undefined;
    firmName = firm?.name ?? null;
  }

  const countCol = row.type === 'prosecution' ? 'prosecution_attorney_id' : 'defense_attorney_id';
  const caseCountResult = await db.query(`SELECT COUNT(*)::int as count FROM cases WHERE ${countCol} = $1`, [row.id]);
  const caseCount = caseCountResult.rows[0]!.count as number;

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    firmId: row.firm_id,
    firmName,
    caseCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

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
    whereClause = `WHERE type = $${paramIdx++}`;
    countParams.push(type);
    rowParams.push(type);
  }

  const countResult = await db.query(`SELECT COUNT(*)::int as count FROM attorneys ${whereClause}`, countParams);
  const total = countResult.rows[0]!.count as number;

  rowParams.push(pageSize, offset);
  const rowsResult = await db.query(
    `SELECT * FROM attorneys ${whereClause} ORDER BY name ASC LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
    rowParams
  );
  const rows = rowsResult.rows as AttorneyRow[];

  const data = await Promise.all(rows.map((r) => toAttorneyResponse(r)));
  paginatedResponse(res, data, total, page, pageSize);
});

// GET /attorneys/:id
router.get('/:id', optionalAuth, async (req, res) => {
  const result = await getDb().query('SELECT * FROM attorneys WHERE id = $1', [req.params.id]);
  const row = result.rows[0] as AttorneyRow | undefined;
  if (!row) {
    apiError(res, 'Attorney not found', 404);
    return;
  }
  apiResponse(res, await toAttorneyResponse(row));
});

export { router as attorneysRoutes };
