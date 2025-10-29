'use client';

import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';

export default function NotificationsBell() {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Закрытие dropdown при клике вне его области
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = (id: string) => { // ← ИЗМЕНИТЬ number НА string
    markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  // Форматирование даты для отображения
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'недавно';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
        return 'недавно';
      }
      
      const now = new Date();
      const diff = now.getTime() - dateObj.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'только что';
      if (minutes < 60) return `${minutes} мин назад`;
      if (hours < 24) return `${hours} ч назад`;
      if (days < 7) return `${days} дн назад`;
      
      return dateObj.toLocaleDateString('ru-RU');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'недавно';
    }
  };

  // Получение иконки для типа уведомления
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task':
        return '📋';
      case 'system':
        return '⚙️';
      case 'warning':
        return '⚠️'; // ← ИСПРАВИТЬ ТИП
      default:
        return '💡';
    }
  };

  // 🔥 МИНИМАЛЬНОЕ ИСПРАВЛЕНИЕ: Создаем уникальные ключи
  const getNotificationKey = (notification: any, index: number) => {
    return `${notification.id}-${index}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Кнопка колокольчика */}
      <button
        onClick={toggleDropdown}
        className="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <span className="text-xl">🔔</span>
        
        {/* Бейдж с количеством непрочитанных */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown с уведомлениями */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Заголовок dropdown */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Уведомления</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Прочитать все
              </button>
            )}
          </div>

          {/* Список уведомлений */}
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Нет уведомлений
              </div>
            ) : (
              // 🔥 ИСПРАВЛЕНИЕ: Используем функцию для уникальных ключей
              notifications.map((notification, index) => (
                <div
                  key={getNotificationKey(notification, index)} // ← Уникальный ключ
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    {/* Иконка уведомления */}
                    <div className="flex-shrink-0 text-lg">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    {/* Содержимое уведомления */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800">
                        {notification.message} {/* ← ИСПРАВЛЕНО: используем message вместо title */}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(notification.timestamp)} {/* ← ИСПРАВЛЕНО: используем timestamp вместо createdAt */}
                      </p>
                    </div>
                    
                    {/* Индикатор непрочитанного */}
                    {!notification.read && (
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Футер dropdown */}
          <div className="p-3 bg-gray-50 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              {notifications.length === 0 
                ? 'Уведомлений пока нет' 
                : `Всего уведомлений: ${notifications.length}`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}