import { processAttendanceExcel } from './reports.service.js';

export const uploadAttendanceReport = async (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error('No file uploaded');
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
      throw error;
    }

    const result = await processAttendanceExcel(req.file.buffer);

    res.status(200).json({
      success: true,
      message: 'Attendance report processed successfully',
      data: result,
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};
