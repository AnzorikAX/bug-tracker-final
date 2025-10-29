"use client";

import TaskBoard from '../components/TaskBoard';
import ProtectedRoute from '../components/ProtectedRoute';
import Sidebar from '../components/Sidebar';
import NotificationsBell from '../components/NotificationsBell';
import LoadingSpinner from '../components/LoadingSpinner';
import ApiTest from '../components/ApiTest';
import DebugApi from '../components/DebugApi'; // ← ДОБАВЛЕНО: Импорт дебаг компонента
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [showApiTest, setShowApiTest] = useState(false);
  const [showDebug, setShowDebug] = useState(true); // ← ДОБАВЛЕНО: состояние для дебага

  const handleCreateTask = () => {
    // Логика создания задачи будет обрабатываться в TaskBoard через модальное окно
    console.log('Create task button clicked');
  };

  const handleAdminPanel = () => {
    router.push('/admin');
  };

  const toggleApiTest = () => {
    setShowApiTest(!showApiTest);
  };

  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };

  // Показываем индикатор загрузки пока проверяется авторизация
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner 
          size="lg" 
          text="Проверка авторизации..." 
        />
      </div>
    );
  }

  return (
  //  <ProtectedRoute>
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
                
                {/* Кнопка дебага ← ДОБАВЛЕНО */}
                <button 
                  onClick={toggleDebug}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2 text-sm"
                >
                  <span>🐛</span>
                  <span>Дебаг</span>
                </button>
                
                {/* Кнопка тестирования API */}
                <button 
                  onClick={toggleApiTest}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2 text-sm"
                >
                  <span>🔧</span>
                  <span>Тест API</span>
                </button>
                
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
            {/* Дебаг компонент ← ДОБАВЛЕНО */}
            {showDebug && <DebugApi />}
            
            {/* Тестовый компонент API */}
            {showApiTest && <ApiTest />}
            
            {/* Основная доска задач */}
            <TaskBoard />
          </main>
        </div>
      </div>
 //   </ProtectedRoute>
  );
}