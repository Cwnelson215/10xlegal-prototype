import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { apiResponse, apiError } from '../utils/responses.js';

const router = Router();

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  lawyer_state_bar: string | null;
  lawyer_bar_number: string | null;
  official_agency: string | null;
  official_id: string | null;
  verification_status: string;
  created_at: string;
  updated_at: string;
}

function toUserResponse(row: UserRow) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    lawyerInfo: row.lawyer_state_bar ? {
      stateBarAssociation: row.lawyer_state_bar,
      barNumber: row.lawyer_bar_number || '',
    } : undefined,
    legalOfficialInfo: row.official_agency ? {
      governmentAgency: row.official_agency,
      officialId: row.official_id || '',
    } : undefined,
    verificationStatus: row.verification_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /users/profile
router.get('/profile', authenticate, (req, res) => {
  const user = getDb().prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as UserRow | undefined;
  if (!user) {
    apiError(res, 'User not found', 404);
    return;
  }
  apiResponse(res, toUserResponse(user));
});

// PUT /users/profile
router.put('/profile', authenticate, (req, res) => {
  const { name, email } = req.body;
  const now = new Date().toISOString();

  const updates: string[] = [];
  const values: unknown[] = [];

  if (name) { updates.push('name = ?'); values.push(name); }
  if (email) { updates.push('email = ?'); values.push(email); }

  if (updates.length === 0) {
    apiError(res, 'No fields to update');
    return;
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(req.user!.id);

  getDb().prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const user = getDb().prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as UserRow;
  apiResponse(res, toUserResponse(user));
});

// GET /users/:id
router.get('/:id', authenticate, (req, res) => {
  const user = getDb().prepare('SELECT * FROM users WHERE id = ?').get(req.params.id) as UserRow | undefined;
  if (!user) {
    apiError(res, 'User not found', 404);
    return;
  }
  apiResponse(res, toUserResponse(user));
});

export { router as usersRoutes };
