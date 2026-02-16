import { errorResponse } from '../utils/response.js';

// Not found handler
export const notFoundHandler = (req, res) => {
  return errorResponse(res, `Route ${req.originalUrl} tidak ditemukan`, 404);
};

// Global error handler
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return errorResponse(res, err.message, 400);
  }
  
  if (err.name === 'UnauthorizedError') {
    return errorResponse(res, 'Unauthorized', 401);
  }
  
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return errorResponse(res, 'Data sudah ada', 409);
  }
  
  if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    return errorResponse(res, 'Data terkait tidak ditemukan', 400);
  }
  
  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  return errorResponse(res, message, statusCode);
};
