import type { ICommentDocument } from '../models/Comment.js';
import type { CreateCommentInput } from '../types/index.js';

export interface ICommentRepository {
  create(data: CreateCommentInput): Promise<ICommentDocument>;
  findById(id: string): Promise<ICommentDocument | null>;
  findByIdPopulated(id: string): Promise<ICommentDocument | null>;
  updateContent(id: string, content: string): Promise<ICommentDocument | null>;
  deleteById(id: string): Promise<ICommentDocument | null>;
}
