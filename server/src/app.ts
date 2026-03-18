import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { routes } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Root-level health check for ALB (before rate limiter)
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// CORS
const allowedOrigins = config.isProduction
  ? [config.frontendUrl]
  : [config.frontendUrl, 'http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: config.isProduction ? 100 : 1000,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});
app.use(limiter);

// Auth endpoints get stricter rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.isProduction ? 20 : 200,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

app.use(express.json({ limit: '10mb' }));

app.use('/api', routes);

app.use(errorHandler);

export { app };
