import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface JwtPayload {
  id: string;
  email: string;
  role: 'admin' | 'user';
  exp?: number;
}

const publicRoutes = ['/api/auth/login', '/api/auth/register', '/api/auth/health'];
const protectedRoutes = ['/api/tasks', '/api/users', '/api/auth/me'];

function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7);
}

function base64UrlToUint8Array(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function parseJwtPayload(encodedPayload: string): JwtPayload | null {
  try {
    const payloadBytes = base64UrlToUint8Array(encodedPayload);
    const payloadJson = new TextDecoder().decode(payloadBytes);
    return JSON.parse(payloadJson) as JwtPayload;
  } catch {
    return null;
  }
}

async function verifyToken(token: string, secret: string): Promise<JwtPayload | null> {
  const parts = token.split('.');

  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  try {
    const headerBytes = base64UrlToUint8Array(encodedHeader);
    const headerJson = new TextDecoder().decode(headerBytes);
    const header = JSON.parse(headerJson) as { alg?: string; typ?: string };

    if (header.alg !== 'HS256') {
      return null;
    }

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signature = base64UrlToUint8Array(encodedSignature);
    const signedData = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);

    const signatureView = new Uint8Array(signature);
    const signedDataView = new Uint8Array(signedData);
    const isValidSignature = await crypto.subtle.verify('HMAC', key, signatureView, signedDataView);
    if (!isValidSignature) {
      return null;
    }

    const payload = parseJwtPayload(encodedPayload);
    if (!payload) {
      return null;
    }

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  if (isPublicRoute) {
    return NextResponse.next();
  }

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return NextResponse.json(
      { success: false, error: 'JWT_SECRET is not configured' },
      { status: 500 }
    );
  }

  const token = extractTokenFromHeader(request.headers.get('authorization'));

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }

  const user = await verifyToken(token, jwtSecret);
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Invalid token' },
      { status: 401 }
    );
  }

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

export const config = {
  matcher: ['/api/:path*'],
};

