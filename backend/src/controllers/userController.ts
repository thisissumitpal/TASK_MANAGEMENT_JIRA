import type { Request, Response, NextFunction } from 'express';
import { userService } from '../services/UserService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getMe = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authorized' });
    return;
  }
  const user = await userService.getMe(req.user._id.toString());
  res.status(200).json({ success: true, data: user });
});

export const getAllUsers = asyncHandler(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const users = await userService.getAllUsers();
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  }
);
