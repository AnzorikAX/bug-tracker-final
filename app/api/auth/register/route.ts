import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { AuthService, type RegisterData } from '@/lib/auth-service'; // ✅ Теперь тип существует
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const registerData: RegisterData = await request.json();
    console.log('🚀 API: User registration attempt:', registerData.email);

    // Валидация обязательных полей
    if (!registerData.email || !registerData.name || !registerData.password) {
      return Response.json(errorResponse('Email, name and password are required'), { status: 400 });
    }

    // Проверка email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerData.email)) {
      return Response.json(errorResponse('Invalid email format'), { status: 400 });
    }

    // Проверка пароля
    if (registerData.password.length < 6) {
      return Response.json(errorResponse('Password must be at least 6 characters long'), { status: 400 });
    }

    // Проверяем, существует ли пользователь с таким email
    const existingUser = await db.get(
      'SELECT id FROM users WHERE email = ?',
      [registerData.email]
    );

    if (existingUser) {
      return Response.json(errorResponse('User with this email already exists'), { status: 400 });
    }

    // Хешируем пароль
    const hashedPassword = await AuthService.hashPassword(registerData.password);

    // Создаем пользователя
    const userId = `user-${Date.now()}`;
    const now = new Date().toISOString();

    const newUser = {
      id: userId,
      email: registerData.email,
      name: registerData.name,
      password: hashedPassword,
      role: registerData.role || 'user',
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

    // Создаем JWT токен
    const userForToken = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role as 'admin' | 'user'
    };

    const token = AuthService.generateToken(userForToken);

    // Возвращаем пользователя без пароля и токен
    const { password, ...userWithoutPassword } = newUser;

    console.log('✅ API: User registered successfully:', newUser.email);
    
    return Response.json(successResponse({
      user: userWithoutPassword,
      token
    }, 'User registered successfully'), { status: 201 });

  } catch (error) {
    console.error('❌ API: Error during registration:', error);
    return Response.json(errorResponse('Registration failed'), { status: 500 });
  }
}