'use client';

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTasks } from '../../hooks/useTasks';
import { useNotifications } from '../../hooks/useNotifications';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { user } = useAuth();
  const { tasks, clearAllTasks, restoreDemoData, exportTasks, getStats } = useTasks();
  const { notifications, clearAll: clearAllNotifications } = useNotifications();
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'system'>('stats');
  const router = useRouter();

  // Проверяем права администратора
  if (user?.role !== 'admin') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Доступ запрещен</h1>
            <p className="text-gray-600">У вас недостаточно прав для просмотра этой страницы</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              ← Вернуться на главную
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const stats = getStats();

  const systemInfo = {
    totalUsers: 3, // В реальном приложении получать из базы
    activeSessions: 1,
    storageUsed: `${Math.round(JSON.stringify(tasks).length / 1024)} KB`,
    lastBackup: new Date().toLocaleDateString('ru-RU')
  };

  const handleClearAllData = () => {
    if (confirm('Вы уверены, что хотите удалить ВСЕ данные? Это действие нельзя отменить!')) {
      clearAllTasks();
      clearAllNotifications();
    }
  };

  const handleExportData = () => {
    exportTasks();
  };

  const handleBackToMain = () => {
    router.push('/');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Заголовок с кнопкой назад */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Панель администратора</h1>
                <p className="text-gray-600">Управление системой и пользователями</p>
              </div>
              <button
                onClick={handleBackToMain}
                className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <span>←</span>
                <span>Назад</span>
              </button>
            </div>
          </div>

          {/* Навигация по табам */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'stats'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📊 Статистика
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'users'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                👥 Пользователи
              </button>
              <button
                onClick={() => setActiveTab('system')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'system'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                ⚙️ Система
              </button>
            </div>

            {/* Содержимое табов */}
            <div className="p-6">
              {activeTab === 'stats' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-800">Статистика системы</h2>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                      <div className="text-sm text-gray-600">Всего задач</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats.done}</div>
                      <div className="text-sm text-gray-600">Выполнено</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{stats.inprogress}</div>
                      <div className="text-sm text-gray-600">В работе</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{stats.highPriority}</div>
                      <div className="text-sm text-gray-600">Высокий приоритет</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">Распределение по статусам</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>К выполнению</span>
                          <span className="font-medium">{stats.todo}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gray-600 h-2 rounded-full" 
                            style={{ width: `${(stats.todo / stats.total) * 100}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>В работе</span>
                          <span className="font-medium">{stats.inprogress}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${(stats.inprogress / stats.total) * 100}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Выполнено</span>
                          <span className="font-medium">{stats.done}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${(stats.done / stats.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">Распределение по приоритетам</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Высокий</span>
                          <span className="font-medium">{stats.highPriority}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{ width: `${(stats.highPriority / stats.total) * 100}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Средний</span>
                          <span className="font-medium">{stats.mediumPriority}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-500 h-2 rounded-full" 
                            style={{ width: `${(stats.mediumPriority / stats.total) * 100}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Низкий</span>
                          <span className="font-medium">{stats.lowPriority}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${(stats.lowPriority / stats.total) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Управление пользователями</h2>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">
                      ⚠️ Функционал управления пользователями будет реализован в следующей версии
                    </p>
                  </div>
                  
                  {/* Демо-пользователи */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-2">👑 Администратор</h4>
                      <p className="text-sm text-gray-600">admin@bugtracker.com</p>
                      <p className="text-xs text-gray-500">Полный доступ к системе</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-2">💻 Разработчик</h4>
                      <p className="text-sm text-gray-600">dev@company.com</p>
                      <p className="text-xs text-gray-500">Стандартные права</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'system' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-800">Системные настройки</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">Информация о системе</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Всего пользователей:</span>
                          <span className="font-medium">{systemInfo.totalUsers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Активные сессии:</span>
                          <span className="font-medium">{systemInfo.activeSessions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Использовано памяти:</span>
                          <span className="font-medium">{systemInfo.storageUsed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Последнее резервное копирование:</span>
                          <span className="font-medium">{systemInfo.lastBackup}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">Действия с данными</h3>
                      <div className="space-y-3">
                        <button
                          onClick={handleExportData}
                          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                        >
                          <span>📥</span>
                          <span>Экспорт всех данных</span>
                        </button>
                        <button
                          onClick={restoreDemoData}
                          className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
                        >
                          <span>🔄</span>
                          <span>Восстановить демо-данные</span>
                        </button>
                        <button
                          onClick={handleClearAllData}
                          className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center space-x-2"
                        >
                          <span>🗑️</span>
                          <span>Очистить все данные</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Уведомления системы</h3>
                    <div className="text-sm text-gray-600">
                      Всего уведомлений: {notifications.length}
                      <br />
                      Непрочитанных: {notifications.filter(n => !n.read).length}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Дополнительная кнопка назад внизу */}
          <div className="text-center">
            <button
              onClick={handleBackToMain}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2 mx-auto"
            >
              <span>←</span>
              <span>Вернуться к задачам</span>
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}