import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: '24h',
  refreshTokenExpiresIn: '7d',
  dbPath: path.join(__dirname, '..', 'data', 'database.sqlite'),
  uploadDir: path.join(__dirname, '..', 'uploads'),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
