import Comment, { type ICommentDocument } from '../models/Comment.js';
import type { CreateCommentInput } from '../types/index.js';
import type { ICommentRepository } from './ICommentRepository.js';

export class CommentRepository implements ICommentRepository {
  async create(data: CreateCommentInput): Promise<ICommentDocument> {
    return Comment.create({
      task: data.taskId,
      user: data.userId,
      content: data.content,
    });
  }

  async findById(id: string): Promise<ICommentDocument | null> {
    return Comment.findById(id).exec();
  }

  async findByIdPopulated(id: string): Promise<ICommentDocument | null> {
    return Comment.findById(id).populate('user', 'name email role').exec();
  }

  async updateContent(id: string, content: string): Promise<ICommentDocument | null> {
    return Comment.findByIdAndUpdate(id, { content }, { new: true, runValidators: true })
      .populate('user', 'name email role')
      .exec();
  }

  async deleteById(id: string): Promise<ICommentDocument | null> {
    return Comment.findById(id).exec();
  }
}

export const commentRepository = new CommentRepository();
