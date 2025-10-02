"use client";

import { useState } from "react";
import { useNotifications } from "./useNotifications";

export type Task = {
  id: number;
  title: string;
  description: string;
  status: "todo" | "inprogress" | "done";
  priority: "low" | "medium" | "high";
  assignee: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: number;
};

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { addNotification } = useNotifications();

  // ✅ Создание задачи
  const createTask = (
    taskData: Omit<Task, "id" | "createdAt" | "updatedAt">,
    userId: number
  ) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    };

    setTasks((prev) => [...prev, newTask]);

    // 🟢 Добавляем уведомление
    addNotification(`Создана новая задача: ${taskData.title}`, "task");
  };

  // ✅ Обновление задачи
  const updateTask = (id: number, updatedFields: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, ...updatedFields, updatedAt: new Date() } : task
      )
    );

    const updatedTask = tasks.find((t) => t.id === id);
    if (updatedTask) {
      addNotification(`Задача обновлена: ${updatedTask.title}`, "task");
    }
  };

  // ✅ Удаление задачи
  const deleteTask = (id: number) => {
    const deletedTask = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.filter((task) => task.id !== id));

    if (deletedTask) {
      addNotification(`Задача удалена: ${deletedTask.title}`, "task");
    }
  };

  // ✅ Перемещение задачи (Kanban drag-n-drop)
  const moveTask = (id: number, newStatus: Task["status"]) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, status: newStatus, updatedAt: new Date() } : task
      )
    );

    const movedTask = tasks.find((t) => t.id === id);
    if (movedTask) {
      addNotification(`Задача перемещена: ${movedTask.title}`, "task");
    }
  };

  // ✅ Статистика
  const getStats = () => {
    return {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "todo").length,
      inprogress: tasks.filter((t) => t.status === "inprogress").length,
      done: tasks.filter((t) => t.status === "done").length,
    };
  };

  // ✅ Фильтрация задач
  const getFilteredTasks = (
    filters: { query?: string; priority?: string; status?: string; assignee?: string },
    sourceTasks: Task[] = tasks
  ) => {
    return sourceTasks.filter((task) => {
      const matchesQuery = filters.query
        ? task.title.toLowerCase().includes(filters.query.toLowerCase()) ||
          task.description.toLowerCase().includes(filters.query.toLowerCase())
        : true;

      const matchesPriority =
        filters.priority && filters.priority !== "all"
          ? task.priority === filters.priority
          : true;

      const matchesStatus =
        filters.status && filters.status !== "all"
          ? task.status === filters.status
          : true;

      const matchesAssignee =
        filters.assignee && filters.assignee !== "all"
          ? task.assignee === filters.assignee
          : true;

      return matchesQuery && matchesPriority && matchesStatus && matchesAssignee;
    });
  };

  // ✅ Задачи конкретного пользователя
  const getUserTasks = (userId: number) => {
    return tasks.filter((t) => t.createdBy === userId || t.assignee === String(userId));
  };

  // ✅ Статистика конкретного пользователя
  const getUserStats = (userId: number) => {
    const userTasks = getUserTasks(userId);
    return {
      total: userTasks.length,
      done: userTasks.filter((t) => t.status === "done").length,
    };
  };

  return {
    tasks,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    getStats,
    getFilteredTasks,
    getUserTasks,
    getUserStats,
  };
}
