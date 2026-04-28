'use client';

import { useState } from 'react';
import { User } from '../hooks/useAuth';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReset: (userId: string, newPassword: string) => boolean;
  user: User | null;
}

export default function ResetPasswordModal({ isOpen, onClose, onReset, user }: ResetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Введите новый пароль');
      return;
    }

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    if (user && onReset(user.id, password)) {
      onClose();
      setPassword('');
      setConfirmPassword('');
    } else {
      setError('Ошибка при сбросе пароля');
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Сброс пароля</h2>

        <div className="mb-4">
          <p className="text-gray-600">
            Пользователь: <span className="font-medium">{user.name}</span>
          </p>
          <p className="text-gray-600">
            Email: <span className="font-medium">{user.email}</span>
          </p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Новый пароль *</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Подтвердите пароль *</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md"
            >
              Отмена
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-md">
              Сбросить пароль
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
