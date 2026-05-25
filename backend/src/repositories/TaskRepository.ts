import type { FilterQuery, UpdateQuery } from 'mongoose';
import Task, { type ITaskDocument } from '../models/Task.js';
import type { CreateTaskInput } from '../types/index.js';
import type { ITaskRepository, TaskListResult } from './ITaskRepository.js';

const userPopulateFields = 'name email role';

export class TaskRepository implements ITaskRepository {
  async findWithFilters(
    query: FilterQuery<ITaskDocument>,
    options: { sort: Record<string, 1 | -1>; skip: number; limit: number }
  ): Promise<TaskListResult> {
    const { sort, skip, limit } = options;
    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('assignee', userPopulateFields)
        .populate('createdBy', userPopulateFields)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      Task.countDocuments(query).exec(),
    ]);
    return { tasks, total };
  }

  async findById(id: string): Promise<ITaskDocument | null> {
    return Task.findById(id).exec();
  }

  async findByIdWithComments(id: string): Promise<ITaskDocument | null> {
    return Task.findById(id)
      .populate('assignee', userPopulateFields)
      .populate('createdBy', userPopulateFields)
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: userPopulateFields,
        },
      })
      .exec();
  }

  async findByIdPopulated(id: string): Promise<ITaskDocument | null> {
    return Task.findById(id)
      .populate('assignee', userPopulateFields)
      .populate('createdBy', userPopulateFields)
      .exec();
  }

  async create(data: CreateTaskInput): Promise<ITaskDocument> {
    return Task.create(data);
  }

  async updateById(
    id: string,
    data: UpdateQuery<ITaskDocument>
  ): Promise<ITaskDocument | null> {
    return Task.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('assignee', userPopulateFields)
      .populate('createdBy', userPopulateFields)
      .exec();
  }

  async deleteById(id: string): Promise<ITaskDocument | null> {
    return Task.findById(id).exec();
  }

  async findAllInScope(query: FilterQuery<ITaskDocument>): Promise<ITaskDocument[]> {
    return Task.find(query).exec();
  }

  async findRecentInScope(
    query: FilterQuery<ITaskDocument>,
    limit: number
  ): Promise<ITaskDocument[]> {
    return Task.find(query)
      .populate('assignee', userPopulateFields)
      .populate('createdBy', userPopulateFields)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .exec();
  }
}

export const taskRepository = new TaskRepository();
