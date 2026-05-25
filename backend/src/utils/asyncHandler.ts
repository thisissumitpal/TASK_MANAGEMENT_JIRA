import type { NextFunction, Request, Response } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export const asyncHandler =
  (fn: AsyncRequestHandler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export const handleServiceError = (
  error: unknown,
  res: Response,
  ServiceErrorClass: new (message: string, statusCode: number) => Error
): boolean => {
  if (error instanceof ServiceErrorClass && 'statusCode' in error) {
    const serviceError = error as Error & { statusCode: number };
    res.status(serviceError.statusCode).json({
      success: false,
      message: serviceError.message,
    });
    return true;
  }
  return false;
};
