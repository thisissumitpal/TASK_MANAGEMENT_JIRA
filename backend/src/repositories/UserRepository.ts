import User, { type IUserDocument } from '../models/User.js';
import type { RegisterInput } from '../types/index.js';
import type { IUserRepository } from './IUserRepository.js';

export class UserRepository implements IUserRepository {
  async findByEmail(email: string, includePassword = false): Promise<IUserDocument | null> {
    const query = User.findOne({ email });
    if (includePassword) {
      query.select('+password');
    }
    return query.exec();
  }

  async findById(id: string): Promise<IUserDocument | null> {
    return User.findById(id).select('-password').exec();
  }

  async countDocuments(): Promise<number> {
    return User.countDocuments().exec();
  }

  async create(data: RegisterInput & { role: string }): Promise<IUserDocument> {
    return User.create(data);
  }

  async findAll(): Promise<IUserDocument[]> {
    return User.find({}).select('-password').sort({ name: 1 }).exec();
  }
}

export const userRepository = new UserRepository();
