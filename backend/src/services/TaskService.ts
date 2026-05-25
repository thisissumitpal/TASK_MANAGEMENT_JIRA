import type { FilterQuery, UpdateQuery } from 'mongoose';
import type { ITaskDocument } from '../models/Task.js';
import type { IUserDocument } from '../models/User.js';
import type { ITaskRepository } from '../repositories/ITaskRepository.js';
import { taskRepository } from '../repositories/TaskRepository.js';
import type {
  CreateTaskInput,
  DashboardMetrics,
  TaskPriority,
  TaskQueryFilters,
  TaskStatus,
} from '../types/index.js';

export class TaskServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'TaskServiceError';
  }
}

export class TaskService {
  constructor(private readonly tasks: ITaskRepository = taskRepository) {}

  private buildScopeQuery(user: IUserDocument): FilterQuery<ITaskDocument> {
    if (user.role === 'Admin') {
      return {};
    }
    return {
      $or: [{ createdBy: user._id }, { assignee: user._id }],
    };
  }

  private getAssigneeId(task: ITaskDocument): string | null {
    if (!task.assignee) return null;
    const assignee = task.assignee as { _id?: { toString(): string }; toString?: () => string };
    if (assignee._id) {
      return assignee._id.toString();
    }
    return assignee.toString?.() ?? String(task.assignee);
  }

  private canViewTask(task: ITaskDocument, user: IUserDocument): boolean {
    if (user.role === 'Admin') return true;
    const userId = user._id.toString();
    const isCreator = task.createdBy.toString() === userId;
    const isAssignee = this.getAssigneeId(task) === userId;
    return isCreator || isAssignee;
  }

  private sanitizeAssignee(assignee: unknown): string | null {
    if (!assignee || assignee === 'undefined' || assignee === 'null' || assignee === '') {
      return null;
    }
    return String(assignee);
  }

  async getTasks(
    user: IUserDocument,
    filters: TaskQueryFilters
  ): Promise<{ tasks: ITaskDocument[]; total: number; page: number; pages: number }> {
    const {
      search,
      status,
      assignee,
      priority,
      sortBy,
      sortOrder = 'asc',
      page = 1,
      limit = 100,
    } = filters;

    const query: FilterQuery<ITaskDocument> = { ...this.buildScopeQuery(user) };

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (status) {
      query.status = status;
    }
    if (assignee) {
      query.assignee = assignee === 'null' ? null : assignee;
    }
    if (priority) {
      query.priority = priority;
    }

    const pageNum = page;
    const limitNum = limit;
    const skipNum = (pageNum - 1) * limitNum;

    let sortQuery: Record<string, 1 | -1> = { createdAt: -1 };
    if (sortBy) {
      sortQuery = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    }

    const { tasks, total } = await this.tasks.findWithFilters(query, {
      sort: sortQuery,
      skip: skipNum,
      limit: limitNum,
    });

    return {
      tasks,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    };
  }

  async getTaskById(id: string, user: IUserDocument): Promise<ITaskDocument> {
    const task = await this.tasks.findByIdWithComments(id);
    if (!task) {
      throw new TaskServiceError('Task not found', 404);
    }

    if (!this.canViewTask(task, user)) {
      throw new TaskServiceError('Not authorized to view this task', 403);
    }

    return task;
  }

  async createTask(
    user: IUserDocument,
    body: Omit<CreateTaskInput, 'createdBy'>
  ): Promise<ITaskDocument> {
    const { title, description, status, priority, dueDate, labels } = body;
    let assignee = this.sanitizeAssignee(body.assignee);

    if (assignee && assignee !== user._id.toString() && user.role !== 'Admin') {
      throw new TaskServiceError(
        'Only Administrators can assign tasks to other users',
        403
      );
    }

    const task = await this.tasks.create({
      title,
      description,
      assignee: assignee || null,
      status: status || 'Todo',
      priority: priority || 'Medium',
      dueDate: dueDate || null,
      labels: labels || [],
      createdBy: user._id,
    });

    const populated = await this.tasks.findByIdPopulated(task._id.toString());
    if (!populated) {
      throw new TaskServiceError('Task not found', 404);
    }
    return populated;
  }

  async updateTask(
    id: string,
    user: IUserDocument,
    body: Record<string, unknown>
  ): Promise<ITaskDocument> {
    const task = await this.tasks.findById(id);
    if (!task) {
      throw new TaskServiceError('Task not found', 404);
    }

    const userId = user._id.toString();
    const isCreator = task.createdBy.toString() === userId;
    const isAssignee = task.assignee && task.assignee.toString() === userId;
    const isAdmin = user.role === 'Admin';

    if (!isAdmin && !isCreator && !isAssignee) {
      throw new TaskServiceError('Not authorized to update this task', 403);
    }

    const updateData: UpdateQuery<ITaskDocument> = {};

    if (isAdmin || isCreator) {
      const allowedFields = [
        'title',
        'description',
        'status',
        'priority',
        'dueDate',
        'labels',
      ] as const;
      for (const field of allowedFields) {
        if (body[field] !== undefined) {
          (updateData as Record<string, unknown>)[field] = body[field];
        }
      }

      if (body.assignee !== undefined) {
        let newAssignee = this.sanitizeAssignee(body.assignee);
        if (!isAdmin && newAssignee && newAssignee !== userId) {
          throw new TaskServiceError(
            'Only Administrators can assign tasks to other users',
            403
          );
        }
        updateData.assignee = newAssignee;
      }
    } else if (isAssignee) {
      if (body.status !== undefined) {
        updateData.status = body.status as TaskStatus;
      } else {
        throw new TaskServiceError(
          'As assignee, you can only update the status of this task',
          403
        );
      }
    }

    const updated = await this.tasks.updateById(id, updateData);
    if (!updated) {
      throw new TaskServiceError('Task not found', 404);
    }
    return updated;
  }

  async deleteTask(id: string, user: IUserDocument): Promise<void> {
    const task = await this.tasks.findById(id);
    if (!task) {
      throw new TaskServiceError('Task not found', 404);
    }

    if (user.role !== 'Admin' && task.createdBy.toString() !== user._id.toString()) {
      throw new TaskServiceError(
        'Only the creator or an Administrator can delete this task',
        403
      );
    }

    await task.deleteOne();
  }

  async getDashboardMetrics(user: IUserDocument): Promise<DashboardMetrics> {
    const scopeQuery = this.buildScopeQuery(user);
    const allScopedTasks = await this.tasks.findAllInScope(scopeQuery);
    const totalTasks = allScopedTasks.length;

    const statusCounts: Record<TaskStatus, number> = {
      Todo: 0,
      'In Progress': 0,
      Review: 0,
      Done: 0,
    };

    const priorityCounts: Record<TaskPriority, number> = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };

    let completedCount = 0;
    let assignedToMeCount = 0;
    const userId = user._id.toString();

    for (const task of allScopedTasks) {
      if (statusCounts[task.status] !== undefined) {
        statusCounts[task.status]++;
      }
      if (task.status === 'Done') {
        completedCount++;
      }
      if (priorityCounts[task.priority] !== undefined) {
        priorityCounts[task.priority]++;
      }
      if (task.assignee && task.assignee.toString() === userId) {
        assignedToMeCount++;
      }
    }

    const completedPercentage =
      totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    const recentTasks = await this.tasks.findRecentInScope(scopeQuery, 5);

    return {
      totalTasks,
      completedTasks: completedCount,
      completedPercentage,
      assignedToMe: assignedToMeCount,
      byStatus: statusCounts,
      byPriority: priorityCounts,
      recentTasks,
    };
  }
}

export const taskService = new TaskService();
