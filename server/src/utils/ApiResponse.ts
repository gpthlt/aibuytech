import { Response } from 'express';

export interface ApiErrorInterface {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorInterface;
}

export class ApiResponse {
  static success<T>(res: Response, data: T, statusCode = 200): Response {
    return res.status(statusCode).json({
      success: true,
      data,
    } as ApiSuccessResponse<T>);
  }

  static error(res: Response, error: ApiErrorInterface, statusCode = 400): Response {
    return res.status(statusCode).json({
      success: false,
      error,
    } as ApiErrorResponse);
  }

  static created<T>(res: Response, data: T): Response {
    return this.success(res, data, 201);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }
}
