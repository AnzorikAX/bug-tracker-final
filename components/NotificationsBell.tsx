"use client";

import { useState } from "react";
import { useNotifications } from "../hooks/useNotifications";

export default function NotificationsBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {/* Колокольчик */}
      <button
        className="relative p-2 rounded-full hover:bg-gray-200"
        onClick={() => setOpen(!open)}
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full px-1 text-xs">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Выпадающий список */}
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white border rounded-lg shadow-lg p-2 z-50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Уведомления</h3>
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-500 hover:underline"
              >
                Отметить все как прочитанные
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-sm text-center">Нет уведомлений</p>
          ) : (
            <ul className="max-h-60 overflow-y-auto">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`p-2 rounded mb-1 cursor-pointer ${
                    n.read ? "bg-gray-100 text-gray-500" : "bg-blue-50"
                  }`}
                >
                  <p className="text-sm">{n.message}</p>
                  <span className="text-xs text-gray-400">
                    {new Date(n.timestamp).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
