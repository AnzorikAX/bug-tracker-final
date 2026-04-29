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
      'SELECT id, email, name, avatar, role, createdAt, updatedAt FROM users WHERE id = ?',
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

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = AuthService.extractTokenFromHeader(authHeader);

    if (!token) {
      return Response.json(errorResponse('Authentication required'), { status: 401 });
    }

    const decodedUser = AuthService.verifyToken(token);
    if (!decodedUser) {
      return Response.json(errorResponse('Invalid or expired token'), { status: 401 });
    }

    const payload = await request.json();
    const name = typeof payload?.name === 'string' ? payload.name.trim() : undefined;
    const email = typeof payload?.email === 'string' ? payload.email.trim().toLowerCase() : undefined;
    const avatar = typeof payload?.avatar === 'string' ? payload.avatar.trim() : undefined;
    const currentPassword = typeof payload?.currentPassword === 'string' ? payload.currentPassword : undefined;
    const newPassword = typeof payload?.newPassword === 'string' ? payload.newPassword : undefined;

    if (name !== undefined && name.length < 2) {
      return Response.json(errorResponse('Name must be at least 2 characters'), { status: 400 });
    }
    if (email !== undefined && !email.includes('@')) {
      return Response.json(errorResponse('Invalid email format'), { status: 400 });
    }
    if (newPassword !== undefined && newPassword.length < 6) {
      return Response.json(errorResponse('New password must be at least 6 characters'), { status: 400 });
    }
    if (newPassword !== undefined && !currentPassword) {
      return Response.json(errorResponse('Current password is required to set a new password'), { status: 400 });
    }

    const user = await db.get<any>('SELECT * FROM users WHERE id = ?', [decodedUser.id]);
    if (!user) {
      return Response.json(errorResponse('User not found'), { status: 404 });
    }

    if (email !== undefined && email !== user.email) {
      const existing = await db.get('SELECT id FROM users WHERE email = ? AND id <> ?', [email, decodedUser.id]);
      if (existing) {
        return Response.json(errorResponse('User with this email already exists'), { status: 400 });
      }
    }

    let hashedPassword = user.password;
    if (newPassword !== undefined) {
      const isPasswordValid = await AuthService.verifyPassword(currentPassword as string, user.password);
      if (!isPasswordValid) {
        return Response.json(errorResponse('Current password is incorrect'), { status: 400 });
      }
      hashedPassword = await AuthService.hashPassword(newPassword);
    }

    const nextName = name ?? user.name;
    const nextEmail = email ?? user.email;
    const nextAvatar = avatar !== undefined ? avatar : (user.avatar || '');
    const updatedAt = new Date().toISOString();

    await db.run(
      'UPDATE users SET name = ?, email = ?, avatar = ?, password = ?, updatedAt = ? WHERE id = ?',
      [nextName, nextEmail, nextAvatar, hashedPassword, updatedAt, decodedUser.id]
    );

    const updatedUser = await db.get(
      'SELECT id, email, name, avatar, role, createdAt, updatedAt FROM users WHERE id = ?',
      [decodedUser.id]
    );

    return Response.json(successResponse({ user: updatedUser }, 'Profile updated successfully'));
  } catch (error) {
    console.error('❌ API: Error updating profile:', error);
    return Response.json(errorResponse('Failed to update profile'), { status: 500 });
  }
}
