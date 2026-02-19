import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { optionalAuth } from '../middleware/auth.js';
import { apiResponse, apiError, parsePagination, paginatedResponse } from '../utils/responses.js';

const router = Router();

interface JudgeRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

// GET /judges
router.get('/', optionalAuth, (req, res) => {
  const { page, pageSize } = parsePagination(req.query as Record<string, unknown>);
  const offset = (page - 1) * pageSize;

  const total = (getDb().prepare('SELECT COUNT(*) as count FROM judges').get() as { count: number }).count;
  const rows = getDb().prepare('SELECT * FROM judges ORDER BY name ASC LIMIT ? OFFSET ?').all(pageSize, offset) as JudgeRow[];

  const results = rows.map((row) => {
    const caseCount = (getDb().prepare('SELECT COUNT(*) as count FROM cases WHERE judge_id = ?').get(row.id) as { count: number }).count;
    const counties = getDb().prepare('SELECT DISTINCT county FROM cases WHERE judge_id = ?').all(row.id) as { county: string }[];
    return {
      id: row.id,
      name: row.name,
      caseCount,
      counties: counties.map((c) => c.county).filter(Boolean),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });

  paginatedResponse(res, results, total, page, pageSize);
});

// GET /judges/:id
router.get('/:id', optionalAuth, (req, res) => {
  const row = getDb().prepare('SELECT * FROM judges WHERE id = ?').get(req.params.id) as JudgeRow | undefined;
  if (!row) {
    apiError(res, 'Judge not found', 404);
    return;
  }

  const caseCount = (getDb().prepare('SELECT COUNT(*) as count FROM cases WHERE judge_id = ?').get(row.id) as { count: number }).count;
  const counties = getDb().prepare('SELECT DISTINCT county FROM cases WHERE judge_id = ?').all(row.id) as { county: string }[];
  const rulings = getDb().prepare('SELECT ruling, COUNT(*) as count FROM cases WHERE judge_id = ? GROUP BY ruling').all(row.id) as { ruling: string; count: number }[];

  const rulingDistribution: Record<string, number> = {};
  for (const r of rulings) {
    rulingDistribution[r.ruling] = r.count;
  }

  apiResponse(res, {
    id: row.id,
    name: row.name,
    caseCount,
    counties: counties.map((c) => c.county).filter(Boolean),
    rulingDistribution,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
});

export { router as judgesRoutes };
