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

function toAttorneyResponse(row: AttorneyRow) {
  let firmName: string | null = null;
  if (row.firm_id) {
    const firm = getDb().prepare('SELECT name FROM law_firms WHERE id = ?').get(row.firm_id) as { name: string } | undefined;
    firmName = firm?.name ?? null;
  }

  const countCol = row.type === 'prosecution' ? 'prosecution_attorney_id' : 'defense_attorney_id';
  const caseCount = (getDb().prepare(`SELECT COUNT(*) as count FROM cases WHERE ${countCol} = ?`).get(row.id) as { count: number }).count;

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
router.get('/', optionalAuth, (req, res) => {
  const { page, pageSize } = parsePagination(req.query as Record<string, unknown>);
  const offset = (page - 1) * pageSize;
  const type = req.query.type as string | undefined;

  let whereClause = '';
  const params: unknown[] = [];
  if (type === 'prosecution' || type === 'defense') {
    whereClause = 'WHERE type = ?';
    params.push(type);
  }

  const total = (getDb().prepare(`SELECT COUNT(*) as count FROM attorneys ${whereClause}`).get(...params) as { count: number }).count;
  const rows = getDb().prepare(`SELECT * FROM attorneys ${whereClause} ORDER BY name ASC LIMIT ? OFFSET ?`).all(...params, pageSize, offset) as AttorneyRow[];

  paginatedResponse(res, rows.map(toAttorneyResponse), total, page, pageSize);
});

// GET /attorneys/:id
router.get('/:id', optionalAuth, (req, res) => {
  const row = getDb().prepare('SELECT * FROM attorneys WHERE id = ?').get(req.params.id) as AttorneyRow | undefined;
  if (!row) {
    apiError(res, 'Attorney not found', 404);
    return;
  }
  apiResponse(res, toAttorneyResponse(row));
});

export { router as attorneysRoutes };
