"use client";

import TaskBoard from '../components/TaskBoard';
import ProtectedRoute from '../components/ProtectedRoute';
import Sidebar from '../components/Sidebar';
import NotificationsBell from '../components/NotificationsBell';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  const handleCreateTask = () => {
    // Логика создания задачи будет обрабатываться в TaskBoard через модальное окно
    // Здесь просто показываем, что кнопка работает
    console.log('Create task button clicked');
  };

  const handleAdminPanel = () => {
    router.push('/admin');
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        {/* Боковая панель */}
        <Sidebar />
        
        {/* Основное содержимое */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Шапка */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">🐛 Bug Tracker</h1>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Привет, {user?.name || 'Пользователь'}!</span>
                
                {/* Колокольчик уведомлений */}
                <NotificationsBell />
                
                {/* Кнопка админки для администраторов */}
                {user?.role === 'admin' && (
                  <button 
                    onClick={handleAdminPanel}
                    className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
                  >
                    <span>👑</span>
                    <span>Админка</span>
                  </button>
                )}
                
                {/* Аватар пользователя */}
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0) || 'П'}
                </div>
                
                {/* Кнопка создания задачи */}
                <button 
                  onClick={handleCreateTask}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                >
                  <span>+</span>
                  <span>Создать задачу</span>
                </button>
              </div>
            </div>
          </header>

          {/* Контент */}
          <main className="flex-1 overflow-auto">
            <TaskBoard />
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}