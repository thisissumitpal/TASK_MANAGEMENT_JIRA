import type { Request, Response, NextFunction } from 'express';
import { TaskServiceError, taskService } from '../services/TaskService.js';
import type { TaskPriority, TaskQueryFilters, TaskStatus } from '../types/index.js';
import { asyncHandler, handleServiceError } from '../utils/asyncHandler.js';

export const getTasks = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authorized' });
    return;
  }
  try {
    const filters: TaskQueryFilters = {
      search: req.query.search as string | undefined,
      status: req.query.status as TaskStatus | undefined,
      assignee: req.query.assignee as string | undefined,
      priority: req.query.priority as TaskPriority | undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
      page: parseInt(String(req.query.page || 1), 10),
      limit: parseInt(String(req.query.limit || 100), 10),
    };

    const { tasks, total, page, pages } = await taskService.getTasks(req.user, filters);

    res.status(200).json({
      success: true,
      count: tasks.length,
      pagination: { total, page, pages },
      data: tasks,
    });
  } catch (error) {
    if (handleServiceError(error, res, TaskServiceError)) return;
    next(error);
  }
});

export const getTaskById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }
    try {
      const task = await taskService.getTaskById(req.params.id, req.user);
      res.status(200).json({ success: true, data: task });
    } catch (error) {
      if (handleServiceError(error, res, TaskServiceError)) return;
      next(error);
    }
  }
);

export const createTask = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authorized' });
    return;
  }
  try {
    const task = await taskService.createTask(req.user, req.body);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    if (handleServiceError(error, res, TaskServiceError)) return;
    next(error);
  }
});

export const updateTask = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authorized' });
    return;
  }
  try {
    const task = await taskService.updateTask(req.params.id, req.user, req.body);
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    if (handleServiceError(error, res, TaskServiceError)) return;
    next(error);
  }
});

export const deleteTask = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authorized' });
    return;
  }
  try {
    await taskService.deleteTask(req.params.id, req.user);
    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    if (handleServiceError(error, res, TaskServiceError)) return;
    next(error);
  }
});

export const getDashboardMetrics = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }
    try {
      const data = await taskService.getDashboardMetrics(req.user);
      res.status(200).json({ success: true, data });
    } catch (error) {
      if (handleServiceError(error, res, TaskServiceError)) return;
      next(error);
    }
  }
);
