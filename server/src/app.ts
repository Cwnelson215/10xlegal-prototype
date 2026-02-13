import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { routes } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json());

app.use('/api', routes);

app.use(errorHandler);

export { app };
