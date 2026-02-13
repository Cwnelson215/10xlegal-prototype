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
router.get('/', authenticate, (req, res) => {
  const { page, pageSize } = parsePagination(req.query as Record<string, unknown>);
  const offset = (page - 1) * pageSize;

  const total = (getDb().prepare('SELECT COUNT(*) as count FROM team_members').get() as { count: number }).count;
  const rows = getDb().prepare('SELECT * FROM team_members ORDER BY joined_at DESC LIMIT ? OFFSET ?').all(pageSize, offset) as TeamMemberRow[];

  paginatedResponse(res, rows.map(toTeamMemberResponse), total, page, pageSize);
});

// POST /team/members
router.post('/members', authenticate, (req, res) => {
  const { email, role } = req.body;

  if (!email || !role) {
    apiError(res, 'Email and role are required');
    return;
  }

  // Look up user by email
  const user = getDb().prepare('SELECT id, name, email, role FROM users WHERE email = ?').get(email) as { id: string; name: string; email: string; role: string } | undefined;

  const id = uuidv4();
  const now = new Date().toISOString();
  const name = user?.name || email.split('@')[0]!;
  const userId = user?.id || uuidv4();

  getDb().prepare(`
    INSERT INTO team_members (id, user_id, name, email, role, joined_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, userId, name, email, role, now);

  const row = getDb().prepare('SELECT * FROM team_members WHERE id = ?').get(id) as TeamMemberRow;
  apiResponse(res, toTeamMemberResponse(row), 201);
});

// GET /team/members/:id
router.get('/members/:id', authenticate, (req, res) => {
  const row = getDb().prepare('SELECT * FROM team_members WHERE id = ?').get(req.params.id) as TeamMemberRow | undefined;
  if (!row) {
    apiError(res, 'Team member not found', 404);
    return;
  }
  apiResponse(res, toTeamMemberResponse(row));
});

// PUT /team/members/:id
router.put('/members/:id', authenticate, (req, res) => {
  const existing = getDb().prepare('SELECT * FROM team_members WHERE id = ?').get(req.params.id) as TeamMemberRow | undefined;
  if (!existing) {
    apiError(res, 'Team member not found', 404);
    return;
  }

  const { role } = req.body;
  if (role) {
    getDb().prepare('UPDATE team_members SET role = ? WHERE id = ?').run(role, req.params.id);
  }

  const row = getDb().prepare('SELECT * FROM team_members WHERE id = ?').get(req.params.id) as TeamMemberRow;
  apiResponse(res, toTeamMemberResponse(row));
});

// DELETE /team/members/:id
router.delete('/members/:id', authenticate, (req, res) => {
  const existing = getDb().prepare('SELECT id FROM team_members WHERE id = ?').get(req.params.id);
  if (!existing) {
    apiError(res, 'Team member not found', 404);
    return;
  }

  getDb().prepare('DELETE FROM team_members WHERE id = ?').run(req.params.id);
  apiResponse(res, null);
});

export { router as teamRoutes };
