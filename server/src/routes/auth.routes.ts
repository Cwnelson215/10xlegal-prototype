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

async function generateTokens(user: { id: string; name: string; email: string; role: string }) {
  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  const refreshToken = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await getDb().query(
    'INSERT INTO refresh_tokens (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)',
    [uuidv4(), user.id, refreshToken, expiresAt]
  );

  return { token, refreshToken };
}

// POST /auth/login
router.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password, role } = req.body;

  const result = await getDb().query(
    'SELECT * FROM users WHERE email = $1 AND (role = $2 OR role = \'admin\')',
    [email, role]
  );
  const user = result.rows[0] as UserRow | undefined;

  if (!user) {
    apiError(res, 'Invalid credentials', 401);
    return;
  }

  if (!bcryptjs.compareSync(password, user.password)) {
    apiError(res, 'Invalid credentials', 401);
    return;
  }

  const tokens = await generateTokens(user);

  apiResponse(res, {
    token: tokens.token,
    refreshToken: tokens.refreshToken,
    user: toUserResponse(user),
  });
});

// POST /auth/register
router.post('/register', validate(registerSchema), async (req, res) => {
  const { name, email, password, role, lawyerInfo, legalOfficialInfo } = req.body;

  const existing = await getDb().query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows[0]) {
    apiError(res, 'Email already registered', 409);
    return;
  }

  const id = uuidv4();
  const hashedPassword = bcryptjs.hashSync(password, 10);
  const now = new Date().toISOString();

  await getDb().query(`
    INSERT INTO users (id, name, email, password, role, lawyer_state_bar, lawyer_bar_number,
      official_agency, official_id, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `, [
    id, name, email, hashedPassword, role,
    lawyerInfo?.stateBarAssociation || null,
    lawyerInfo?.barNumber || null,
    legalOfficialInfo?.governmentAgency || null,
    legalOfficialInfo?.officialId || null,
    now, now,
  ]);

  const userResult = await getDb().query('SELECT * FROM users WHERE id = $1', [id]);
  const user = userResult.rows[0] as UserRow;
  const tokens = await generateTokens(user);

  apiResponse(res, {
    token: tokens.token,
    refreshToken: tokens.refreshToken,
    user: toUserResponse(user),
  }, 201);
});

// POST /auth/logout
router.post('/logout', authenticate, async (req, res) => {
  await getDb().query('DELETE FROM refresh_tokens WHERE user_id = $1', [req.user!.id]);
  apiResponse(res, null);
});

// POST /auth/refresh-token
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    apiError(res, 'Refresh token is required');
    return;
  }

  const tokenResult = await getDb().query(
    'SELECT * FROM refresh_tokens WHERE token = $1',
    [refreshToken]
  );
  const tokenRow = tokenResult.rows[0] as { id: string; user_id: string; expires_at: string } | undefined;

  if (!tokenRow) {
    apiError(res, 'Invalid refresh token', 401);
    return;
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    await getDb().query('DELETE FROM refresh_tokens WHERE id = $1', [tokenRow.id]);
    apiError(res, 'Refresh token expired', 401);
    return;
  }

  // Delete old refresh token
  await getDb().query('DELETE FROM refresh_tokens WHERE id = $1', [tokenRow.id]);

  const userResult = await getDb().query('SELECT * FROM users WHERE id = $1', [tokenRow.user_id]);
  const user = userResult.rows[0] as UserRow | undefined;
  if (!user) {
    apiError(res, 'User not found', 401);
    return;
  }

  const tokens = await generateTokens(user);

  apiResponse(res, {
    token: tokens.token,
    refreshToken: tokens.refreshToken,
    user: toUserResponse(user),
  });
});

// GET /auth/verify-token
router.get('/verify-token', authenticate, async (req, res) => {
  const result = await getDb().query('SELECT * FROM users WHERE id = $1', [req.user!.id]);
  const user = result.rows[0] as UserRow;
  apiResponse(res, toUserResponse(user));
});

export { router as authRoutes };
