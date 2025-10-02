"use client";

import { useAuth } from "../hooks/useAuth";

export default function LoginPanel() {
  const { user, login, logout } = useAuth();

  return (
    <div className="text-sm">
      {user ? (
        <div className="flex items-center space-x-2">
          <span>👤 {user.name}</span>
          <button
            onClick={logout}
            className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
          >
            Выйти
          </button>
        </div>
      ) : (
        <div className="flex space-x-2">
          <button
            onClick={() => login({ name: "Иван Иванов", role: "admin" })}
            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
          >
            Войти как Иван
          </button>
          <button
            onClick={() => login({ name: "Мария Сидорова", role: "user" })}
            className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
          >
            Войти как Мария
          </button>
        </div>
      )}
    </div>
  );
}
