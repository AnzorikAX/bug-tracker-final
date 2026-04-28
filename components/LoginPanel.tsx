"use client";

import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';

export default function LoginPanel() {
  const { user, logout } = useAuth();

  if (user) {
    return (
      <div className="text-sm flex items-center space-x-2">
        <span>{user.name}</span>
        <button
          onClick={logout}
          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
        >
          Выйти
        </button>
      </div>
    );
  }

  return (
    <div className="text-sm">
      <Link href="/auth/login" className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">
        Войти
      </Link>
    </div>
  );
}
