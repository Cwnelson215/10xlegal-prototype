import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { usersRoutes } from './users.routes.js';
import { casesRoutes } from './cases.routes.js';
import { deadlinesRoutes } from './deadlines.routes.js';
import { documentsRoutes } from './documents.routes.js';
import { teamRoutes } from './team.routes.js';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/cases', casesRoutes);
router.use('/deadlines', deadlinesRoutes);
router.use('/documents', documentsRoutes);
router.use('/team', teamRoutes);

export { router as routes };
