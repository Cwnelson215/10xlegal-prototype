import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { optionalAuth } from '../middleware/auth.js';
import { apiResponse, apiError, parsePagination, paginatedResponse } from '../utils/responses.js';

const router = Router();

interface FirmRow {
  id: string;
  name: string;
  type: string;
  created_at: string;
  updated_at: string;
}

async function toFirmResponse(row: FirmRow, includeAttorneys = false) {
  const db = getDb();

  const attorneyCountResult = await db.query('SELECT COUNT(*)::int as count FROM attorneys WHERE firm_id = $1', [row.id]);
  const attorneyCount = attorneyCountResult.rows[0]!.count as number;

  const prosResult = await db.query('SELECT COUNT(*)::int as count FROM cases WHERE prosecution_firm_id = $1', [row.id]);
  const prosCaseCount = prosResult.rows[0]!.count as number;
  const defResult = await db.query('SELECT COUNT(*)::int as count FROM cases WHERE defense_firm_id = $1', [row.id]);
  const defCaseCount = defResult.rows[0]!.count as number;
  const caseCount = prosCaseCount + defCaseCount;

  const result: Record<string, unknown> = {
    id: row.id,
    name: row.name,
    type: row.type || null,
    attorneyCount,
    caseCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  if (includeAttorneys) {
    const attorneysResult = await db.query('SELECT id, name, type FROM attorneys WHERE firm_id = $1 ORDER BY name ASC', [row.id]);
    result.attorneys = attorneysResult.rows;
  }

  return result;
}

// GET /firms
router.get('/', optionalAuth, async (req, res) => {
  const { page, pageSize } = parsePagination(req.query as Record<string, unknown>);
  const offset = (page - 1) * pageSize;
  const db = getDb();

  const countResult = await db.query('SELECT COUNT(*)::int as count FROM law_firms');
  const total = countResult.rows[0]!.count as number;
  const rowsResult = await db.query('SELECT * FROM law_firms ORDER BY name ASC LIMIT $1 OFFSET $2', [pageSize, offset]);
  const rows = rowsResult.rows as FirmRow[];

  const data = await Promise.all(rows.map((r) => toFirmResponse(r)));
  paginatedResponse(res, data, total, page, pageSize);
});

// GET /firms/:id
router.get('/:id', optionalAuth, async (req, res) => {
  const result = await getDb().query('SELECT * FROM law_firms WHERE id = $1', [req.params.id]);
  const row = result.rows[0] as FirmRow | undefined;
  if (!row) {
    apiError(res, 'Firm not found', 404);
    return;
  }
  apiResponse(res, await toFirmResponse(row, true));
});

export { router as firmsRoutes };
