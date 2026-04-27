// app/api/env-test/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_EMAIL_ENABLED: process.env.NEXT_PUBLIC_EMAIL_ENABLED,
    NODE_ENV: process.env.NODE_ENV,
    allPublicVars: Object.keys(process.env)
      .filter(key => key.startsWith('NEXT_PUBLIC_'))
      .reduce((acc, key) => {
        acc[key] = process.env[key];
        return acc;
      }, {} as Record<string, string>)
  });
}