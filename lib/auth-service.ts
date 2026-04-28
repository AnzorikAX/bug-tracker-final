import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_EXPIRES_IN = '7d';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  name: string;
  password: string;
  role?: 'admin' | 'user';
}

export class AuthService {
  static generateToken(user: AuthUser): string {
    const jwtSecret = getJwtSecret();

    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  static verifyToken(token: string): AuthUser | null {
    try {
      const jwtSecret = getJwtSecret();
      return jwt.verify(token, jwtSecret) as AuthUser;
    } catch {
      return null;
    }
  }

  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch {
      return false;
    }
  }

  static extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    return authHeader.substring(7);
  }
}
