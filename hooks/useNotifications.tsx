"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

export type Notification = {
  id: string;
  message: string;
  type?: "task" | "system" | "admin";
  read: boolean;
  timestamp: number;
};

type NotificationsContextType = {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (message: string, type?: "task" | "system" | "admin") => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
};

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Загружаем уведомления из localStorage
  useEffect(() => {
    const saved = localStorage.getItem("notifications");
    if (saved) {
      setNotifications(JSON.parse(saved));
    }
  }, []);

  // Сохраняем при изменении
  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = useCallback((message: string, type: "task" | "system" | "admin" = "system") => {
    const newNotif: Notification = {
      id: Date.now().toString(),
      message,
      type,
      read: false,
      timestamp: Date.now(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider");
  return ctx;
};
