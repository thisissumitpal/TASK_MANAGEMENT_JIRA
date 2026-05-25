import type { Types } from 'mongoose';

export type UserRole = 'Admin' | 'Member';

export type TaskStatus = 'Todo' | 'In Progress' | 'Review' | 'Done';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface AuthUserPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  assignee?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | string | null;
  labels?: string[];
  createdBy: Types.ObjectId | string;
}

export interface TaskQueryFilters {
  search?: string;
  status?: TaskStatus;
  assignee?: string;
  priority?: TaskPriority;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface TaskScopeQuery {
  $or?: Array<{ createdBy: string } | { assignee: string }>;
}

export interface CreateCommentInput {
  taskId: string;
  userId: string;
  content: string;
}

export interface DashboardMetrics {
  totalTasks: number;
  completedTasks: number;
  completedPercentage: number;
  assignedToMe: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  recentTasks: unknown[];
}
