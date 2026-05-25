import type { FilterQuery, UpdateQuery } from 'mongoose';
import type { ITaskDocument } from '../models/Task.js';
import type { CreateTaskInput } from '../types/index.js';

export interface TaskListResult {
  tasks: ITaskDocument[];
  total: number;
}

export interface ITaskRepository {
  findWithFilters(
    query: FilterQuery<ITaskDocument>,
    options: { sort: Record<string, 1 | -1>; skip: number; limit: number }
  ): Promise<TaskListResult>;
  findById(id: string): Promise<ITaskDocument | null>;
  findByIdWithComments(id: string): Promise<ITaskDocument | null>;
  findByIdPopulated(id: string): Promise<ITaskDocument | null>;
  create(data: CreateTaskInput): Promise<ITaskDocument>;
  updateById(id: string, data: UpdateQuery<ITaskDocument>): Promise<ITaskDocument | null>;
  deleteById(id: string): Promise<ITaskDocument | null>;
  findAllInScope(query: FilterQuery<ITaskDocument>): Promise<ITaskDocument[]>;
  findRecentInScope(
    query: FilterQuery<ITaskDocument>,
    limit: number
  ): Promise<ITaskDocument[]>;
}
