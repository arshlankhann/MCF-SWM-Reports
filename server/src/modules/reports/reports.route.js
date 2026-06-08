import express from 'express';
import multer from 'multer';
import { uploadAttendanceReport } from './reports.controller.js';

const router = express.Router();

// Setup multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), uploadAttendanceReport);

export default router;
