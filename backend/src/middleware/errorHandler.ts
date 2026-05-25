import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';

interface AppError extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: Record<string, unknown>;
  errors?: Record<string, { message: string }>;
  value?: unknown;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error: AppError = { ...err, message: err.message };

  console.error('Error occurred:', err);

  if (err.name === 'CastError') {
    error.message = `Resource not found with id of ${(err as mongoose.Error.CastError).value}`;
    error.statusCode = 404;
  }

  if (err.code === 11000 && err.keyValue) {
    const field = Object.keys(err.keyValue)[0];
    error.message = `An account with this ${field} already exists.`;
    error.statusCode = 400;
  }

  if (err.name === 'ValidationError' && err.errors) {
    error.message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error.statusCode = 400;
  }

  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token, authorization denied';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token has expired, please log in again';
    error.statusCode = 401;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
  });
};
