import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'debug-secret-key-12345';
const JWT_EXPIRES_IN = '7d';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

// 🔥 ДОБАВЛЯЕМ НЕДОСТАЮЩИЙ ТИП
export interface RegisterData {
  email: string;
  name: string;
  password: string;
  role?: 'admin' | 'user';
}

export class AuthService {
  // Генерация JWT токена
  static generateToken(user: AuthUser): string {
    console.log('🔐 Generating token for:', user.email);
    return jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  // Верификация JWT токена
  static verifyToken(token: string): AuthUser | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
      console.log('✅ Token verified for:', decoded.email);
      return decoded;
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      return null;
    }
  }

  // Хеширование пароля
  static async hashPassword(password: string): Promise<string> {
    console.log('🔑 Hashing password...');
    const saltRounds = 12;
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('✅ Password hashed successfully');
    return hash;
  }

  // Проверка пароля
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    console.log('🔑 Verifying password...');
    try {
      const isValid = await bcrypt.compare(password, hashedPassword);
      console.log('✅ Password verification:', isValid ? 'VALID' : 'INVALID');
      return isValid;
    } catch (error) {
      console.error('❌ Password verification error:', error);
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