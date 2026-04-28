import { testEmailConnection } from '@/lib/email-service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await testEmailConnection();

    return NextResponse.json({
      status: result.success ? 'success' : 'error',
      message: result.success ? 'Email service works correctly' : 'Email service error',
      previewUrl: result.previewUrl,
      instruction: 'instruction' in result ? result.instruction : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Unexpected email test error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({
    message: 'POST method not implemented yet',
    received: body,
  });
}
