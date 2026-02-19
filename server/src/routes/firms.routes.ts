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

function toFirmResponse(row: FirmRow, includeAttorneys = false) {
  const attorneyCount = (getDb().prepare('SELECT COUNT(*) as count FROM attorneys WHERE firm_id = ?').get(row.id) as { count: number }).count;

  const prosCaseCount = (getDb().prepare('SELECT COUNT(*) as count FROM cases WHERE prosecution_firm_id = ?').get(row.id) as { count: number }).count;
  const defCaseCount = (getDb().prepare('SELECT COUNT(*) as count FROM cases WHERE defense_firm_id = ?').get(row.id) as { count: number }).count;
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
    const attorneys = getDb().prepare('SELECT id, name, type FROM attorneys WHERE firm_id = ? ORDER BY name ASC').all(row.id) as { id: string; name: string; type: string }[];
    result.attorneys = attorneys;
  }

  return result;
}

// GET /firms
router.get('/', optionalAuth, (req, res) => {
  const { page, pageSize } = parsePagination(req.query as Record<string, unknown>);
  const offset = (page - 1) * pageSize;

  const total = (getDb().prepare('SELECT COUNT(*) as count FROM law_firms').get() as { count: number }).count;
  const rows = getDb().prepare('SELECT * FROM law_firms ORDER BY name ASC LIMIT ? OFFSET ?').all(pageSize, offset) as FirmRow[];

  paginatedResponse(res, rows.map((r) => toFirmResponse(r)), total, page, pageSize);
});

// GET /firms/:id
router.get('/:id', optionalAuth, (req, res) => {
  const row = getDb().prepare('SELECT * FROM law_firms WHERE id = ?').get(req.params.id) as FirmRow | undefined;
  if (!row) {
    apiError(res, 'Firm not found', 404);
    return;
  }
  apiResponse(res, toFirmResponse(row, true));
});

export { router as firmsRoutes };
