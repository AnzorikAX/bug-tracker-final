import { NextResponse } from 'next/server';

export async function GET() {
  const publicVars = Object.keys(process.env)
    .filter((key) => key.startsWith('NEXT_PUBLIC_'))
    .reduce<Record<string, string | undefined>>((acc, key) => {
      acc[key] = process.env[key];
      return acc;
    }, {});

  return NextResponse.json({
    NEXT_PUBLIC_EMAIL_ENABLED: process.env.NEXT_PUBLIC_EMAIL_ENABLED,
    NODE_ENV: process.env.NODE_ENV,
    allPublicVars: publicVars,
  });
}
