import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { AuthService, type LoginCredentials } from '@/lib/auth-service';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const credentials: LoginCredentials = await request.json();
    console.log('🔐 API: Login attempt:', credentials.email);

    // Валидация обязательных полей
    if (!credentials.email || !credentials.password) {
      return Response.json(errorResponse('Email and password are required'), { status: 400 });
    }

    // Ищем пользователя по email
    const user = await db.get(
      'SELECT * FROM users WHERE email = ?',
      [credentials.email]
    );

    if (!user) {
      console.log('❌ API: User not found:', credentials.email);
      return Response.json(errorResponse('Invalid email or password'), { status: 401 });
    }

    // Проверяем пароль
    const isPasswordValid = await AuthService.verifyPassword(
      credentials.password,
      user.password
    );

    if (!isPasswordValid) {
      console.log('❌ API: Invalid password for user:', credentials.email);
      return Response.json(errorResponse('Invalid email or password'), { status: 401 });
    }

    // Создаем JWT токен
    const userForToken = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'admin' | 'user'
    };

    const token = AuthService.generateToken(userForToken);

    // Возвращаем пользователя без пароля и токен
    const { password, ...userWithoutPassword } = user;

    console.log('✅ API: Login successful:', user.email);
    
    return Response.json(successResponse({
      user: userWithoutPassword,
      token
    }, 'Login successful'));

  } catch (error) {
    console.error('❌ API: Error during login:', error);
    return Response.json(errorResponse('Login failed'), { status: 500 });
  }
}