// ─────────────────────────────────────────────
// SENTINEL API — Global Error Handler
// ─────────────────────────────────────────────

import type { ErrorRequestHandler } from 'express';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, code?: string);
  constructor(message: string, statusCode?: number, code?: string);
  constructor(
    arg1: string | number,
    arg2?: string | number,
    code?: string,
    isOperational = true
  ) {
    let message: string;
    let statusCode: number;

    if (typeof arg1 === 'number') {
      statusCode = arg1;
      message = typeof arg2 === 'string' ? arg2 : 'An error occurred';
    } else {
      message = arg1;
      statusCode = typeof arg2 === 'number' ? arg2 : 500;
    }

    super(message);
    this.statusCode = statusCode;
    this.code = code || (statusCode >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST');
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // Don't leak internal error details in production
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  console.error('Unhandled error:', err);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
    },
  });
};
