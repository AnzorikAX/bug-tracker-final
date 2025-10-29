'use client';

import { useEffect } from 'react';

// Типы для toast-уведомлений
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

// Компонент отдельного toast-уведомления
export default function Toast({ toast, onRemove }: ToastProps) {
  // Автоматическое удаление toast после заданного времени
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  // Стили для разных типов уведомлений
  const getToastStyles = (type: ToastType) => {
    const baseStyles = "max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5";
    
    switch (type) {
      case 'success':
        return `${baseStyles} border-l-4 border-green-500`;
      case 'error':
        return `${baseStyles} border-l-4 border-red-500`;
      case 'warning':
        return `${baseStyles} border-l-4 border-yellow-500`;
      case 'info':
        return `${baseStyles} border-l-4 border-blue-500`;
      default:
        return baseStyles;
    }
  };

  // Иконки для разных типов уведомлений
  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '💡';
    }
  };

  return (
    <div className={getToastStyles(toast.type)}>
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 text-xl">
            {getIcon(toast.type)}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {toast.message}
            </p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-200">
        <button
          onClick={() => onRemove(toast.id)}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-800 focus:outline-none"
        >
          ✕
        </button>
      </div>
    </div>
  );
}