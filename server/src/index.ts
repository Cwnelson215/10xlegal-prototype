import { app } from './app.js';
import { config } from './config.js';
import { initDb } from './db/connection.js';
import { runSchema } from './db/schema.js';
import { seedDatabase } from './db/seed.js';

const start = () => {
  initDb();
  runSchema();
  seedDatabase();

  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
    console.log(`API available at http://localhost:${config.port}/api`);
  });
};

start();
