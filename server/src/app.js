import express from 'express';
import cors from 'cors';
import { errorHandler } from './common/middlewares/error.middleware.js';
import reportsRoute from './modules/reports/reports.route.js';

const app = express();

const normalizeOrigin = (origin) => origin.replace(/\/$/, '');

const allowedOrigins = process.env.CORS_ORIGIN
  ?.split(',')
  .map((origin) => normalizeOrigin(origin.trim()))
  .filter(Boolean) ?? [];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(normalizeOrigin(origin))) {
      callback(null, origin);
      return;
    }

    callback(null, false);
  },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/reports', reportsRoute);

// Global Error Handler
app.use(errorHandler);

export default app;
