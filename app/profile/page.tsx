'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../hooks/useAuth';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    newTasks: true,
    weeklyReport: false,
    deadlineReminders: true,
    taskUpdates: true
  });

  if (!user) {
    return null;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      alert('Редактирование профиля временно недоступно через API');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Ошибка при обновлении профиля');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email
    });
    setIsEditing(false);
  };

  const handleNotificationChange = (setting: keyof typeof notificationSettings) => {
    const newSettings = {
      ...notificationSettings,
      [setting]: !notificationSettings[setting]
    };

    setNotificationSettings(newSettings);
    alert(`Настройка "${setting}" изменена. В реальном приложении это сохранится в базе.`);
  };

  const handleSaveAllNotifications = () => {
    alert('Настройки уведомлений сохранены (демо-режим)');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Мой профиль</h1>
              <p className="text-gray-600">Управление вашей учетной записью</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              ← Назад
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                    {getInitials(user.name)}
                  </div>

                  <h2 className="text-xl font-semibold text-gray-800">{user.name}</h2>
                  <p className="text-gray-600">{user.email}</p>
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="text-sm text-gray-600">
                      <strong>ID пользователя:</strong>
                      <br />
                      {user.id}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-medium text-gray-700 mb-3">Действия</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    Редактировать профиль
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Вернуться к задачам
                  </button>
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    Выйти из системы
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              {isEditing ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Редактирование профиля</h3>

                  <form onSubmit={handleSave} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Полное имя</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Введите ваше имя"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email адрес</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
                      >
                        {isLoading ? 'Сохранение...' : 'Сохранить'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Отмена
                      </button>
                    </div>

                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        Редактирование профиля временно недоступно через API. В реальном приложении здесь будет
                        работа с бэкендом.
                      </p>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Статистика активности</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">12</div>
                        <div className="text-sm text-gray-600">Создано задач</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">8</div>
                        <div className="text-sm text-gray-600">Выполнено</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">3</div>
                        <div className="text-sm text-gray-600">В работе</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">95%</div>
                        <div className="text-sm text-gray-600">Эффективность</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Настройки уведомлений</h3>
                      <button
                        onClick={handleSaveAllNotifications}
                        className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                      >
                        Сохранить настройки
                      </button>
                    </div>

                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Это демонстрация настроек уведомлений. В реальном приложении настройки будут сохраняться в базе
                        данных.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-800">Email уведомления</div>
                          <div className="text-sm text-gray-600">Получать уведомления на email</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notificationSettings.email}
                            onChange={() => handleNotificationChange('email')}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-800">Новые задачи</div>
                          <div className="text-sm text-gray-600">Уведомления о новых задачах</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notificationSettings.newTasks}
                            onChange={() => handleNotificationChange('newTasks')}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-800">Обновления задач</div>
                          <div className="text-sm text-gray-600">Уведомления об изменениях в задачах</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notificationSettings.taskUpdates}
                            onChange={() => handleNotificationChange('taskUpdates')}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-800">Напоминания о дедлайнах</div>
                          <div className="text-sm text-gray-600">Уведомления о приближающихся дедлайнах</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notificationSettings.deadlineReminders}
                            onChange={() => handleNotificationChange('deadlineReminders')}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-800">Еженедельный отчет</div>
                          <div className="text-sm text-gray-600">Автоматические отчеты о прогрессе</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notificationSettings.weeklyReport}
                            onChange={() => handleNotificationChange('weeklyReport')}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
