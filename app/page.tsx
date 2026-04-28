"use client";

import TaskBoard from '../components/TaskBoard';
import ProtectedRoute from '../components/ProtectedRoute';
import Sidebar from '../components/Sidebar';
import NotificationsBell from '../components/NotificationsBell';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const handleAdminPanel = () => {
    router.push('/admin');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Проверка авторизации..." />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">Bug Tracker</h1>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Привет, {user?.name || 'Пользователь'}!</span>

                <NotificationsBell />

                {user?.role === 'admin' && (
                  <button
                    onClick={handleAdminPanel}
                    className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
                  >
                    <span>Админка</span>
                  </button>
                )}

                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0) || 'П'}
                </div>

              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <TaskBoard />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
