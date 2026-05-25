import type { IUserDocument } from '../models/User.js';
import type { IUserRepository } from '../repositories/IUserRepository.js';
import { userRepository } from '../repositories/UserRepository.js';

export class UserService {
  constructor(private readonly users: IUserRepository = userRepository) {}

  async getMe(userId: string): Promise<IUserDocument | null> {
    return this.users.findById(userId);
  }

  async getAllUsers(): Promise<IUserDocument[]> {
    return this.users.findAll();
  }
}

export const userService = new UserService();
