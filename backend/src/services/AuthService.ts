import type { IUserRepository } from '../repositories/IUserRepository.js';
import { userRepository } from '../repositories/UserRepository.js';
import type { AuthUserPayload, LoginInput, RegisterInput } from '../types/index.js';
import { generateToken } from '../utils/jwt.js';

export interface AuthResult {
  token: string;
  user: AuthUserPayload;
}

export class AuthService {
  constructor(private readonly users: IUserRepository = userRepository) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const { name, email, password, role } = input;

    const userExists = await this.users.findByEmail(email);
    if (userExists) {
      throw new AuthServiceError('User already exists', 400);
    }

    let assignedRole = role || 'Member';
    const isFirstUser = (await this.users.countDocuments()) === 0;
    if (isFirstUser) {
      assignedRole = 'Admin';
    }

    const user = await this.users.create({
      name,
      email,
      password,
      role: assignedRole,
    });

    const token = generateToken(user._id);

    return {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const { email, password } = input;

    if (!email || !password) {
      throw new AuthServiceError('Please provide email and password', 400);
    }

    const user = await this.users.findByEmail(email, true);
    if (!user) {
      throw new AuthServiceError('Invalid credentials', 401);
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new AuthServiceError('Invalid credentials', 401);
    }

    const token = generateToken(user._id);

    return {
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}

export class AuthServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

export const authService = new AuthService();
