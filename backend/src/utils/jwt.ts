import jwt, { type SignOptions } from 'jsonwebtoken';
import type { Types } from 'mongoose';

export const generateToken = (id: Types.ObjectId | string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRE || '24h') as SignOptions['expiresIn'],
  };
  return jwt.sign({ id: id.toString() }, secret, options);
};
