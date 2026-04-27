// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Edge-совместимая проверка JWT (без использования jsonwebtoken)
const verifyToken = (token: string): any => {
  try {
    // Простая проверка формата токена (для демо)
    // В продакшене используйте Edge-совместимую JWT библиотеку
    if (!token || token.length < 50) {
      return null;
    }
    
    // Декодируем base64 payload (без проверки подписи для демо)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString()
    );
    
    // Проверяем expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

const extractTokenFromHeader = (authHeader: string | null): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

// Публичные маршруты
const publicRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/health'
];

// Защищенные маршруты
const protectedRoutes = [
  '/api/tasks',
  '/api/users',
  '/api/auth/me'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Пропускаем публичные маршруты
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Проверяем защищенные маршруты
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  if (isProtectedRoute) {
    const token = extractTokenFromHeader(
      request.headers.get('authorization')
    );

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Добавляем информацию о пользователе в заголовки
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-email', user.email);
    requestHeaders.set('x-user-role', user.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};