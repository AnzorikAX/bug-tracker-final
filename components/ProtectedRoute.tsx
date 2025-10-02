'use client';

import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Ждем завершения загрузки перед проверкой авторизации
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Показываем загрузку во время проверки авторизации
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  // Показываем детей только если авторизован
  return isAuthenticated ? <>{children}</> : null;
}