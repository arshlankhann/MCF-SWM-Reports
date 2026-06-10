import express from 'express';
import multer from 'multer';
import { uploadAttendanceReport, uploadVehicleReport } from './reports.controller.js';

const router = express.Router();

// Setup multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), uploadAttendanceReport);
router.post('/upload-vehicle', upload.single('file'), uploadVehicleReport);

export default router;
