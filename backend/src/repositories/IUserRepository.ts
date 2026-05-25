import type { IUserDocument } from '../models/User.js';
import type { RegisterInput } from '../types/index.js';

export interface IUserRepository {
  findByEmail(email: string, includePassword?: boolean): Promise<IUserDocument | null>;
  findById(id: string): Promise<IUserDocument | null>;
  countDocuments(): Promise<number>;
  create(data: RegisterInput & { role: string }): Promise<IUserDocument>;
  findAll(): Promise<IUserDocument[]>;
}
