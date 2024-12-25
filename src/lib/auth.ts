import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';

export interface JWTPayload {
  id: string;
  email: string;
  role: string;
}

export function generateToken(payload: JWTPayload, expiresIn = '24h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export async function getAuthUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  
  return verifyToken(token);
}

export function isAdmin(user: JWTPayload): boolean {
  return user.role === 'admin';
}
