'use client';

import { useEffect, useState } from 'react';
import { User } from '../hooks/useAuth';

type UserFormData = {
  email: string;
  name: string;
  password: string;
  role: 'admin' | 'user';
};

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: UserFormData) => Promise<boolean>;
  user?: User | null;
  mode: 'create' | 'edit';
}

export default function UserModal({ isOpen, onClose, onSave, user, mode }: UserModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    password: '',
    role: 'user',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && mode === 'edit') {
      setFormData({
        email: user.email,
        name: user.name,
        password: '',
        role: user.role,
      });
    } else {
      setFormData({ email: '', name: '', password: '', role: 'user' });
    }
    setError('');
  }, [user, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await onSave(formData);
      if (success) {
        onClose();
      } else {
        setError(mode === 'create' ? 'Не удалось создать пользователя' : 'Не удалось обновить пользователя');
      }
    } catch {
      setError('Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{mode === 'create' ? 'Создать пользователя' : 'Редактировать пользователя'}</h2>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Полное имя *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {mode === 'create' ? 'Пароль *' : 'Новый пароль (опционально)'}
            </label>
            <input
              type="password"
              required={mode === 'create'}
              value={formData.password}
              onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value as 'admin' | 'user' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="user">Пользователь</option>
              <option value="admin">Администратор</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md"
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
            >
              {isLoading ? 'Сохранение...' : mode === 'create' ? 'Создать' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
