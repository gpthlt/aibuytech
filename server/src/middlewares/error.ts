import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/ApiResponse.js';
import { logger } from '../utils/logger.js';
import { RequestWithId } from './requestId.js';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code || `ERR_${statusCode}`;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Async handler wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const requestId = (req as RequestWithId).id;

  logger.error('Error occurred:', {
    requestId,
    error: err.message,
    stack: err.stack,
  });

  if (err instanceof AppError) {
    ApiResponse.error(
      res,
      {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      err.statusCode
    );
    return;
  }

  // Default error
  ApiResponse.error(
    res,
    {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
    500
  );
};

export const notFoundHandler = (req: Request, res: Response): void => {
  ApiResponse.error(
    res,
    {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    404
  );
};
