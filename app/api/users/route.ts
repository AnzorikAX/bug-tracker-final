import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { AuthService } from '@/lib/auth-service';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API: Fetching users from database...');
    
    const users = await db.all(`
      SELECT id, email, name, role, createdAt, updatedAt 
      FROM users 
      ORDER BY createdAt DESC
    `);

    console.log('✅ API: Found', users.length, 'users in database');
    return Response.json(successResponse(users));
  } catch (error) {
    console.error('❌ API: Error fetching users:', error);
    return Response.json(errorResponse('Failed to fetch users'), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    console.log('🚀 API: Creating user:', userData.email);

    // Валидация обязательных полей
    if (!userData.email || !userData.name || !userData.password) {
      return Response.json(errorResponse('Email, name and password are required'), { status: 400 });
    }

    // Проверка email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return Response.json(errorResponse('Invalid email format'), { status: 400 });
    }

    // Проверка пароля
    if (userData.password.length < 6) {
      return Response.json(errorResponse('Password must be at least 6 characters long'), { status: 400 });
    }

    // Проверяем, существует ли пользователь с таким email
    const existingUser = await db.get(
      'SELECT id FROM users WHERE email = ?',
      [userData.email]
    );

    if (existingUser) {
      return Response.json(errorResponse('User with this email already exists'), { status: 400 });
    }

    // Хешируем пароль
    const hashedPassword = await AuthService.hashPassword(userData.password);

    // Создаем пользователя
    const userId = `user-${Date.now()}`;
    const now = new Date().toISOString();

    const newUser = {
      id: userId,
      email: userData.email,
      name: userData.name,
      password: hashedPassword,
      role: userData.role || 'user',
      createdAt: now,
      updatedAt: now
    };

    await db.run(
      `INSERT INTO users (id, email, name, password, role, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        newUser.id,
        newUser.email,
        newUser.name,
        newUser.password,
        newUser.role,
        newUser.createdAt,
        newUser.updatedAt
      ]
    );

    // Возвращаем пользователя без пароля
    const { password, ...userWithoutPassword } = newUser;

    console.log('✅ API: User created successfully:', newUser.email);
    
    return Response.json(successResponse({
      user: userWithoutPassword
    }, 'User created successfully'), { status: 201 });

  } catch (error) {
    console.error('❌ API: Error creating user:', error);
    return Response.json(errorResponse('Failed to create user'), { status: 500 });
  }
}