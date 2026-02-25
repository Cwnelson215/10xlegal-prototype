import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { apiResponse, apiError, parsePagination, paginatedResponse } from '../utils/responses.js';

const router = Router();

interface TeamMemberRow {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  joined_at: string;
}

function toTeamMemberResponse(row: TeamMemberRow) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    role: row.role,
    joinedAt: row.joined_at,
  };
}

// GET /team
router.get('/', authenticate, async (req, res) => {
  const { page, pageSize } = parsePagination(req.query as Record<string, unknown>);
  const offset = (page - 1) * pageSize;
  const db = getDb();

  const countResult = await db.query('SELECT COUNT(*)::int as count FROM team_members');
  const total = countResult.rows[0]!.count as number;
  const rowsResult = await db.query('SELECT * FROM team_members ORDER BY joined_at DESC LIMIT $1 OFFSET $2', [pageSize, offset]);
  const rows = rowsResult.rows as TeamMemberRow[];

  paginatedResponse(res, rows.map(toTeamMemberResponse), total, page, pageSize);
});

// POST /team/members
router.post('/members', authenticate, async (req, res) => {
  const { email, role } = req.body;
  const db = getDb();

  if (!email || !role) {
    apiError(res, 'Email and role are required');
    return;
  }

  const userResult = await db.query('SELECT id, name, email, role FROM users WHERE email = $1', [email]);
  const user = userResult.rows[0] as { id: string; name: string; email: string; role: string } | undefined;

  const id = uuidv4();
  const now = new Date().toISOString();
  const name = user?.name || email.split('@')[0]!;
  const userId = user?.id || uuidv4();

  await db.query(`
    INSERT INTO team_members (id, user_id, name, email, role, joined_at)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [id, userId, name, email, role, now]);

  const result = await db.query('SELECT * FROM team_members WHERE id = $1', [id]);
  const row = result.rows[0] as TeamMemberRow;
  apiResponse(res, toTeamMemberResponse(row), 201);
});

// GET /team/members/:id
router.get('/members/:id', authenticate, async (req, res) => {
  const result = await getDb().query('SELECT * FROM team_members WHERE id = $1', [req.params.id]);
  const row = result.rows[0] as TeamMemberRow | undefined;
  if (!row) {
    apiError(res, 'Team member not found', 404);
    return;
  }
  apiResponse(res, toTeamMemberResponse(row));
});

// PUT /team/members/:id
router.put('/members/:id', authenticate, async (req, res) => {
  const db = getDb();
  const existingResult = await db.query('SELECT * FROM team_members WHERE id = $1', [req.params.id]);
  const existing = existingResult.rows[0] as TeamMemberRow | undefined;
  if (!existing) {
    apiError(res, 'Team member not found', 404);
    return;
  }

  const { role } = req.body;
  if (role) {
    await db.query('UPDATE team_members SET role = $1 WHERE id = $2', [role, req.params.id]);
  }

  const result = await db.query('SELECT * FROM team_members WHERE id = $1', [req.params.id]);
  const row = result.rows[0] as TeamMemberRow;
  apiResponse(res, toTeamMemberResponse(row));
});

// DELETE /team/members/:id
router.delete('/members/:id', authenticate, async (req, res) => {
  const db = getDb();
  const existingResult = await db.query('SELECT id FROM team_members WHERE id = $1', [req.params.id]);
  if (!existingResult.rows[0]) {
    apiError(res, 'Team member not found', 404);
    return;
  }

  await db.query('DELETE FROM team_members WHERE id = $1', [req.params.id]);
  apiResponse(res, null);
});

export { router as teamRoutes };
