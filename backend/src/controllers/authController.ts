import type { Request, Response, NextFunction } from 'express';
import { AuthServiceError, authService } from '../services/AuthService.js';
import { asyncHandler, handleServiceError } from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    if (handleServiceError(error, res, AuthServiceError)) return;
    next(error);
  }
});

export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    if (handleServiceError(error, res, AuthServiceError)) return;
    next(error);
  }
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});
