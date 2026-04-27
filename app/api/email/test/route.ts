import { testEmailConnection } from '@/app/lib/email-service';
import { NextResponse } from 'next/server';

// 🔥 Важно: НЕ default export, а named export GET
export async function GET() {
  try {
    console.log('🧪 Тестируем email соединение...');
    
    const result = await testEmailConnection();
    
    const responseData = {
      status: result.success ? 'success' : 'error',
      message: result.success 
        ? 'Email service работает корректно!' 
        : 'Ошибка в email service',
      previewUrl: result.previewUrl,
      instruction: result.instruction,
      timestamp: new Date().toISOString()
    };
    
    console.log('📧 Результат теста:', responseData.status);
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('❌ Неожиданная ошибка при тестировании email:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Неожиданная ошибка при тестировании email',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 🔥 Также можно добавить другие методы если нужно
export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ 
    message: 'POST method not implemented yet',
    received: body 
  });
}