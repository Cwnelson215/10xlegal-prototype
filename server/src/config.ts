import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

export const config = {
  isProduction,
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: '24h' as const,
  refreshTokenExpiresIn: '7d' as const,
  dbPath: path.join(__dirname, '..', 'data', 'database.sqlite'),
  uploadDir: path.join(__dirname, '..', 'uploads'),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
