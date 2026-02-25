import { app } from './app.js';
import { config } from './config.js';
import { initDb } from './db/connection.js';
import { runSchema } from './db/schema.js';
import { seedDatabase } from './db/seed.js';
import { logger } from './utils/logger.js';

const start = async () => {
  await initDb();
  await runSchema();
  await seedDatabase();

  app.listen(config.port, () => {
    logger.info(`Server running on http://localhost:${config.port}`);
    logger.info(`API available at http://localhost:${config.port}/api`);
  });
};

start().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});
