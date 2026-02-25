import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

function buildDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const name = process.env.DB_NAME || '10xlegal';
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres';
  return `postgresql://${user}:${password}@${host}:${port}/${name}`;
}

export const config = {
  isProduction,
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: '24h' as const,
  refreshTokenExpiresIn: '7d' as const,
  databaseUrl: buildDatabaseUrl(),
  uploadDir: path.join(__dirname, '..', 'uploads'),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
