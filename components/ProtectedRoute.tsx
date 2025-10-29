"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth(); // ← УБРАЛ checkAuth из зависимостей
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // 🔥 ИСПРАВЛЕНИЕ: Проверяем только один раз при монтировании
    if (!hasChecked && !isLoading) {
      if (!user) {
        console.log('🔐 ProtectedRoute: User not authenticated, redirecting to login...');
        router.push('/auth/login');
      }
      setHasChecked(true);
    }
  }, [user, isLoading, hasChecked, router]);

  // Показываем загрузку во время первоначальной проверки
  if (isLoading || !hasChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner 
          size="lg" 
          text="Проверка авторизации..." 
        />
      </div>
    );
  }

  // Если пользователь авторизован - показываем детей
  if (user) {
    console.log('🔐 ProtectedRoute: User authenticated, showing content:', user.email);
    return <>{children}</>;
  }

  // Если не авторизован - показываем загрузку (будет редирект)
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoadingSpinner 
        size="lg" 
        text="Перенаправление на страницу входа..." 
      />
    </div>
  );
}