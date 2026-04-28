'use client';

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const [activeView, setActiveView] = useState('dashboard');
  const { user, logout } = useAuth();
  const router = useRouter();

  const menuItems = [
    { id: 'dashboard', label: 'Дашборд', icon: '📊' },
    { id: 'backlog', label: 'Бэклог', icon: '📋' },
    { id: 'active', label: 'Активные задачи', icon: '🚀' },
    { id: 'completed', label: 'Завершенные', icon: '✅' },
    { id: 'my', label: 'Мои задачи', icon: '👤' },
    { id: 'profile', label: 'Мой профиль', icon: '⚙️' },
  ];

  const projects = [
    { id: 1, name: 'Основной проект' },
    { id: 2, name: 'Второстепенный проект' },
  ];

  const handleMenuItemClick = (itemId: string) => {
    setActiveView(itemId);
    if (itemId === 'profile') {
      router.push('/profile');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <div className="w-64 bg-white h-screen border-r border-gray-200 p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-blue-600">🐛 Bug Tracker</h1>
        {user && <p className="text-sm text-gray-600 mt-1">Привет, {user.name}</p>}
      </div>

      <nav className="mb-8 flex-1">
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Меню</h3>
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleMenuItemClick(item.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  activeView === item.id
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Проекты</h3>
        <ul className="space-y-1">
          {projects.map((project) => (
            <li key={project.id}>
              <button className="w-full text-left px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                📁 {project.name}
              </button>
            </li>
          ))}
        </ul>
        <button className="w-full text-left px-3 py-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors mt-2">
          + Создать проект
        </button>
      </div>

      <div className="mt-auto border-t pt-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Пользователь'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.role === 'admin' ? 'Администратор' : 'Пользователь'}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors flex items-center"
        >
          <span className="mr-2">🚪</span>
          Выйти
        </button>
      </div>
    </div>
  );
}
