import { Router } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { getDb } from '../db/connection.js';
import { authenticate } from '../middleware/auth.js';
import { apiResponse, apiError } from '../utils/responses.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../validation/schemas.js';

const router = Router();

interface UserRow {
  id: string;
  name: string;
  email: string;
  password: string;
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

function generateTokens(user: { id: string; name: string; email: string; role: string }) {
  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  const refreshToken = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  getDb().prepare(
    'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)'
  ).run(uuidv4(), user.id, refreshToken, expiresAt);

  return { token, refreshToken };
}

// POST /auth/login
router.post('/login', validate(loginSchema), (req, res) => {
  const { email, password, role } = req.body;

  const user = getDb().prepare(
    'SELECT * FROM users WHERE email = ? AND role = ?'
  ).get(email, role) as UserRow | undefined;

  if (!user) {
    apiError(res, 'Invalid credentials', 401);
    return;
  }

  if (!bcryptjs.compareSync(password, user.password)) {
    apiError(res, 'Invalid credentials', 401);
    return;
  }

  const tokens = generateTokens(user);

  apiResponse(res, {
    token: tokens.token,
    refreshToken: tokens.refreshToken,
    user: toUserResponse(user),
  });
});

// POST /auth/register
router.post('/register', validate(registerSchema), (req, res) => {
  const { name, email, password, role, lawyerInfo, legalOfficialInfo } = req.body;

  const existing = getDb().prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    apiError(res, 'Email already registered', 409);
    return;
  }

  const id = uuidv4();
  const hashedPassword = bcryptjs.hashSync(password, 10);
  const now = new Date().toISOString();

  getDb().prepare(`
    INSERT INTO users (id, name, email, password, role, lawyer_state_bar, lawyer_bar_number,
      official_agency, official_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, name, email, hashedPassword, role,
    lawyerInfo?.stateBarAssociation || null,
    lawyerInfo?.barNumber || null,
    legalOfficialInfo?.governmentAgency || null,
    legalOfficialInfo?.officialId || null,
    now, now
  );

  const user = getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow;
  const tokens = generateTokens(user);

  apiResponse(res, {
    token: tokens.token,
    refreshToken: tokens.refreshToken,
    user: toUserResponse(user),
  }, 201);
});

// POST /auth/logout
router.post('/logout', authenticate, (req, res) => {
  getDb().prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(req.user!.id);
  apiResponse(res, null);
});

// POST /auth/refresh-token
router.post('/refresh-token', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    apiError(res, 'Refresh token is required');
    return;
  }

  const tokenRow = getDb().prepare(
    'SELECT * FROM refresh_tokens WHERE token = ?'
  ).get(refreshToken) as { id: string; user_id: string; expires_at: string } | undefined;

  if (!tokenRow) {
    apiError(res, 'Invalid refresh token', 401);
    return;
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    getDb().prepare('DELETE FROM refresh_tokens WHERE id = ?').run(tokenRow.id);
    apiError(res, 'Refresh token expired', 401);
    return;
  }

  // Delete old refresh token
  getDb().prepare('DELETE FROM refresh_tokens WHERE id = ?').run(tokenRow.id);

  const user = getDb().prepare('SELECT * FROM users WHERE id = ?').get(tokenRow.user_id) as UserRow | undefined;
  if (!user) {
    apiError(res, 'User not found', 401);
    return;
  }

  const tokens = generateTokens(user);

  apiResponse(res, {
    token: tokens.token,
    refreshToken: tokens.refreshToken,
    user: toUserResponse(user),
  });
});

// GET /auth/verify-token
router.get('/verify-token', authenticate, (req, res) => {
  const user = getDb().prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as UserRow;
  apiResponse(res, toUserResponse(user));
});

export { router as authRoutes };
