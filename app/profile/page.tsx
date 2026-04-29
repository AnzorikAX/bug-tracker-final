'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useAuth } from '../../hooks/useAuth';

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024;
const PREVIEW_SIZE = 240;
const EXPORT_SIZE = 256;

export default function ProfilePage() {
  const { user, logout, checkAuth } = useAuth();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);
  const [avatarSource, setAvatarSource] = useState<string>('');
  const [avatarImage, setAvatarImage] = useState<HTMLImageElement | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    newTasks: true,
    weeklyReport: false,
    deadlineReminders: true,
    taskUpdates: true
  });
  const notificationLabels: Record<keyof typeof notificationSettings, { title: string; description: string }> = {
    email: { title: 'Email уведомления', description: 'Получать уведомления на email' },
    newTasks: { title: 'Новые задачи', description: 'Уведомления о новых задачах' },
    weeklyReport: { title: 'Еженедельный отчет', description: 'Автоматические отчеты о прогрессе' },
    deadlineReminders: { title: 'Напоминания о дедлайнах', description: 'Уведомления о приближающихся дедлайнах' },
    taskUpdates: { title: 'Обновления задач', description: 'Уведомления об изменениях в задачах' }
  };

  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      name: user.name,
      email: user.email,
      avatar: user.avatar || ''
    }));
  }, [user]);

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  };

  const getCurrentAvatar = () => {
    return formData.avatar || user.avatar || '';
  };

  const getDrawScale = () => {
    if (!avatarImage) return 1;
    const baseScale = Math.max(PREVIEW_SIZE / avatarImage.width, PREVIEW_SIZE / avatarImage.height);
    return baseScale * cropZoom;
  };

  const openFileDialog = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
    avatarInputRef.current?.click();
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = '';

    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setSaveError('Допустимые форматы: JPG, PNG, WEBP.');
      return;
    }

    if (file.size > MAX_AVATAR_FILE_SIZE) {
      setSaveError('Максимальный размер файла: 5 МБ.');
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
      reader.readAsDataURL(file);
    });

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Не удалось загрузить изображение'));
      image.src = dataUrl;
    });

    setSaveError(null);
    setAvatarSource(dataUrl);
    setAvatarImage(img);
    setCropZoom(1);
    setCropX(0);
    setCropY(0);
    setAvatarEditorOpen(true);
  };

  const applyAvatarCrop = () => {
    if (!avatarImage) return;

    const canvas = document.createElement('canvas');
    canvas.width = EXPORT_SIZE;
    canvas.height = EXPORT_SIZE;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);
    ctx.save();
    ctx.beginPath();
    ctx.arc(EXPORT_SIZE / 2, EXPORT_SIZE / 2, EXPORT_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const scale = Math.max(EXPORT_SIZE / avatarImage.width, EXPORT_SIZE / avatarImage.height) * cropZoom;
    const dx = (EXPORT_SIZE - avatarImage.width * scale) / 2 + cropX * (EXPORT_SIZE / PREVIEW_SIZE);
    const dy = (EXPORT_SIZE - avatarImage.height * scale) / 2 + cropY * (EXPORT_SIZE / PREVIEW_SIZE);

    ctx.drawImage(avatarImage, dx, dy, avatarImage.width * scale, avatarImage.height * scale);
    ctx.restore();

    const croppedAvatar = canvas.toDataURL('image/jpeg', 0.9);

    setFormData((prev) => ({ ...prev, avatar: croppedAvatar }));
    setAvatarEditorOpen(false);
    setAvatarSource('');
    setAvatarImage(null);
  };

  const closeAvatarEditor = () => {
    setAvatarEditorOpen(false);
    setAvatarSource('');
    setAvatarImage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        setSaveError('Новый пароль и подтверждение не совпадают');
        return;
      }

      const token = localStorage.getItem('bug-tracker-token');
      if (!token) {
        setSaveError('Сессия истекла. Войдите снова.');
        return;
      }

      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          avatar: formData.avatar,
          currentPassword: formData.currentPassword || undefined,
          newPassword: formData.newPassword || undefined
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        setSaveError(result.error || 'Ошибка при обновлении профиля');
        return;
      }

      await checkAuth();
      setSaveMessage('Профиль обновлен');
      setIsEditing(false);
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveError('Ошибка при обновлении профиля');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setSaveMessage(null);
    setSaveError(null);
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

  const previewScale = getDrawScale();
  const avatarToShow = getCurrentAvatar();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleAvatarFileChange}
          />

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
                  <button
                    type="button"
                    onClick={openFileDialog}
                    className="mx-auto mb-4 block group"
                    title="Нажмите, чтобы выбрать фото"
                  >
                    {avatarToShow ? (
                      <img
                        src={avatarToShow}
                        alt="Аватар пользователя"
                        className="w-24 h-24 rounded-full object-cover border border-gray-200 group-hover:opacity-90"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold group-hover:opacity-90">
                        {getInitials(user.name)}
                      </div>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 mb-3">Нажмите на аватар, чтобы изменить фото</p>

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

                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                      Аватар выбирается кликом по фото слева. Форматы: JPG/PNG/WEBP, до 5 МБ.
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Текущий пароль</label>
                        <input
                          type="password"
                          value={formData.currentPassword}
                          onChange={(e) => setFormData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Обязателен при смене пароля"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Новый пароль</label>
                        <input
                          type="password"
                          value={formData.newPassword}
                          onChange={(e) => setFormData((prev) => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Минимум 6 символов"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Подтверждение нового пароля</label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Повторите новый пароль"
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

                    {saveMessage && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">{saveMessage}</p>
                      </div>
                    )}

                    {saveError && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">{saveError}</p>
                      </div>
                    )}
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
                      {Object.entries(notificationSettings).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-800">
                              {notificationLabels[key as keyof typeof notificationSettings].title}
                            </div>
                            <div className="text-sm text-gray-600">
                              {notificationLabels[key as keyof typeof notificationSettings].description}
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={value}
                              onChange={() => handleNotificationChange(key as keyof typeof notificationSettings)}
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-blue-500" />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {avatarEditorOpen && avatarImage && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-5">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Обрезка аватара</h4>

              <div className="mx-auto mb-4 w-[240px] h-[240px] rounded-full overflow-hidden border border-gray-300 relative bg-gray-100">
                <img
                  src={avatarSource}
                  alt="Предпросмотр"
                  className="absolute select-none"
                  draggable={false}
                  style={{
                    width: `${avatarImage.width * previewScale}px`,
                    height: `${avatarImage.height * previewScale}px`,
                    left: `${(PREVIEW_SIZE - avatarImage.width * previewScale) / 2 + cropX}px`,
                    top: `${(PREVIEW_SIZE - avatarImage.height * previewScale) / 2 + cropY}px`
                  }}
                />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Масштаб</label>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={cropZoom}
                    onChange={(e) => setCropZoom(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Смещение по горизонтали</label>
                  <input
                    type="range"
                    min="-120"
                    max="120"
                    step="1"
                    value={cropX}
                    onChange={(e) => setCropX(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Смещение по вертикали</label>
                  <input
                    type="range"
                    min="-120"
                    max="120"
                    step="1"
                    value={cropY}
                    onChange={(e) => setCropY(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAvatarEditor}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={applyAvatarCrop}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Применить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
