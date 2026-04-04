/**
 * Error Handling Middleware
 * Centralized error handler for all routes
 */
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: string
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.details || error.message,
    });
    return;
  }

  // Log unexpected errors
  console.error('Unexpected error:', error);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    errors: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
  });
};
