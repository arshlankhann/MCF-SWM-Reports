import express from 'express';
import cors from 'cors';
import { errorHandler } from './common/middlewares/error.middleware.js';
import reportsRoute from './modules/reports/reports.route.js';

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1/reports', reportsRoute);

// Global Error Handler
app.use(errorHandler);

export default app;
