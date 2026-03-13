import { app } from './app.js';
import { config } from './config.js';
import { initDb } from './db/connection.js';
import { runSchema } from './db/schema.js';
import { logger } from './utils/logger.js';

const start = async () => {
  await initDb();
  await runSchema();

  app.listen(config.port, () => {
    logger.info(`Server running on port ${config.port}`);
    logger.info(`API available at http://localhost:${config.port}/api`);
  });
};

start().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});
