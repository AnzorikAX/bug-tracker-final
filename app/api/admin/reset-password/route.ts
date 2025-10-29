import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { AuthService } from '@/lib/auth-service';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json();
    
    if (!email || !newPassword) {
      return Response.json(errorResponse('Email and new password are required'), { status: 400 });
    }

    // Хешируем новый пароль
    const hashedPassword = await AuthService.hashPassword(newPassword);

    // Обновляем пароль в базе
    await db.run(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, email]
    );

    console.log(`✅ Password reset for user: ${email}`);
    
    return Response.json(successResponse(null, 'Password reset successfully'));
  } catch (error) {
    console.error('Error resetting password:', error);
    return Response.json(errorResponse('Failed to reset password'), { status: 500 });
  }
}