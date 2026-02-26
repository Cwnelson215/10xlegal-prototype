import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { usersRoutes } from './users.routes.js';
import { casesRoutes } from './cases.routes.js';
import { deadlinesRoutes } from './deadlines.routes.js';
import { documentsRoutes } from './documents.routes.js';
import { attorneysRoutes } from './attorneys.routes.js';
import { firmsRoutes } from './firms.routes.js';
import { getDb } from '../db/connection.js';

const router = Router();

// Health check
router.get('/health', async (_req, res) => {
  let dbStatus = 'unknown';
  try {
    const result = await getDb().query('SELECT 1 as ok');
    dbStatus = result.rows[0]?.ok === 1 ? 'connected' : 'error';
  } catch {
    dbStatus = 'error';
  }

  res.json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: dbStatus,
  });
});

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/cases', casesRoutes);
router.use('/deadlines', deadlinesRoutes);
router.use('/documents', documentsRoutes);
router.use('/attorneys', attorneysRoutes);
router.use('/firms', firmsRoutes);

export { router as routes };
