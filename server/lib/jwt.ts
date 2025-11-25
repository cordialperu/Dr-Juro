import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.SESSION_SECRET || 'development-jwt-secret';
const JWT_EXPIRY = '7d';

export interface JWTPayload {
  userId: string;
  userRole: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}
