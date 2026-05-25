import type { Request, Response, NextFunction } from 'express';
import { CommentServiceError, commentService } from '../services/CommentService.js';
import { asyncHandler, handleServiceError } from '../utils/asyncHandler.js';

export const addComment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authorized' });
    return;
  }
  try {
    const { taskId, content } = req.body;
    const comment = await commentService.addComment(req.user, taskId, content);
    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    if (handleServiceError(error, res, CommentServiceError)) return;
    next(error);
  }
});

export const editComment = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authorized' });
    return;
  }
  try {
    const comment = await commentService.editComment(
      req.user,
      req.params.id,
      req.body.content
    );
    res.status(200).json({ success: true, data: comment });
  } catch (error) {
    if (handleServiceError(error, res, CommentServiceError)) return;
    next(error);
  }
});

export const deleteComment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }
    try {
      await commentService.deleteComment(req.user, req.params.id);
      res.status(200).json({ success: true, message: 'Comment deleted successfully' });
    } catch (error) {
      if (handleServiceError(error, res, CommentServiceError)) return;
      next(error);
    }
  }
);
