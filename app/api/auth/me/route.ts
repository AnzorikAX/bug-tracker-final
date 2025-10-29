import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { AuthService } from '@/lib/auth-service';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    // Извлекаем токен из заголовка Authorization
    const authHeader = request.headers.get('Authorization');
    const token = AuthService.extractTokenFromHeader(authHeader);

    if (!token) {
      return Response.json(errorResponse('Authentication required'), { status: 401 });
    }

    // Верифицируем токен
    const decodedUser = AuthService.verifyToken(token);
    if (!decodedUser) {
      return Response.json(errorResponse('Invalid or expired token'), { status: 401 });
    }

    // Получаем актуальные данные пользователя из базы
    const user = await db.get(
      'SELECT id, email, name, role, createdAt, updatedAt FROM users WHERE id = ?',
      [decodedUser.id]
    );

    if (!user) {
      return Response.json(errorResponse('User not found'), { status: 404 });
    }

    console.log('✅ API: Current user fetched:', user.email);
    
    return Response.json(successResponse({
      user
    }, 'User data retrieved successfully'));

  } catch (error) {
    console.error('❌ API: Error fetching current user:', error);
    return Response.json(errorResponse('Failed to fetch user data'), { status: 500 });
  }
}