"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type NotificationType =
  | "task_created"
  | "task_updated"
  | "task_deleted"
  | "task_assigned"
  | "task_completed"
  | "task_due_soon";

export type Notification = {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;        // 🔹 добавляем поле для статуса прочитанности
  timestamp: string;    // 🔹 строка для отображения времени
};

type NotificationsContextType = {
  notifications: Notification[];
  addNotification: (
    type: NotificationType,
    data: { title: string; message: string }
  ) => void;
  removeNotification: (id: number) => void;
  clearNotifications: () => void;

  // 🔹 добавляем методы для совместимости с NotificationsBell
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  unreadCount: number;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(
  undefined
);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (
    type: NotificationType,
    data: { title: string; message: string }
  ) => {
    const newNotification: Notification = {
      id: Date.now(),
      type,
      title: data.title,
      message: data.message,
      createdAt: new Date(),
      read: false,
      timestamp: new Date().toLocaleString(), // удобный формат для отображения
    };
    setNotifications((prev) => [...prev, newNotification]);
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const markAsRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearNotifications,
        markAsRead,
        markAllAsRead,
        unreadCount,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return context;
}
