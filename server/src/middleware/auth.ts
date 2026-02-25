import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { getDb } from '../db/connection.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'No token provided' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthUser;
    const result = await getDb().query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id]);
    const user = result.rows[0] as AuthUser | undefined;
    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthUser;
    const result = await getDb().query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id]);
    const user = result.rows[0] as AuthUser | undefined;
    if (user) {
      req.user = user;
    }
  } catch {
    // Token invalid — continue as unauthenticated
  }
  next();
}
