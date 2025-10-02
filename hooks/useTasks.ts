"use client";

import { useState } from "react";
import { useNotifications } from "./useNotifications";

// Тип задачи
export type Task = {
  id: number;
  title: string;
  description: string;
  status: "todo" | "inprogress" | "done";
  priority: "low" | "medium" | "high";
  assignee: string;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
};

// Хук для управления задачами
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const { addNotification } = useNotifications();

  // Создание задачи
  const createTask = (
    taskData: Omit<Task, "id" | "createdAt" | "updatedAt" | "createdBy">,
    userId: number
  ) => {
    const newTask: Task = {
      id: Date.now(),
      ...taskData,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTasks((prev) => [...prev, newTask]);

    addNotification("task_created", {
      title: "Задача создана",
      message: `Новая задача "${newTask.title}" успешно добавлена.`,
    });
  };

  // Обновление задачи
  const updateTask = (taskId: number, updatedFields: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, ...updatedFields, updatedAt: new Date() } : task
      )
    );

    addNotification("task_updated", {
      title: "Задача обновлена",
      message: `Задача #${taskId} обновлена.`,
    });
  };

  // Завершение задачи
  const completeTask = (taskId: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: "done", updatedAt: new Date() } : task
      )
    );

    addNotification("task_completed", {
      title: "Задача завершена",
      message: `Задача #${taskId} отмечена как выполненная.`,
    });
  };

  // Удаление задачи
  const deleteTask = (taskId: number) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));

    addNotification("task_deleted", {
      title: "Задача удалена",
      message: `Задача #${taskId} удалена.`,
    });
  };

  // Перемещение задачи (Drag & Drop)
  const moveTask = (taskId: number, newStatus: "todo" | "inprogress" | "done") => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status: newStatus, updatedAt: new Date() } : task
      )
    );

    addNotification("task_updated", {
      title: "Статус изменён",
      message: `Задача #${taskId} перемещена в ${newStatus}.`,
    });
  };

  // --- Фильтрация задач ---
  function getFilteredTasks(
    filters: {
      query?: string;
      status?: string;
      priority?: string;
      assignee?: string;
    },
    tasks: Task[]
  ): Task[] {
    return tasks.filter((task) => {
      const matchesQuery =
        !filters.query ||
        task.title.toLowerCase().includes(filters.query.toLowerCase()) ||
        task.description.toLowerCase().includes(filters.query.toLowerCase());

      const matchesStatus =
        !filters.status || filters.status === "all" || task.status === filters.status;

      const matchesPriority =
        !filters.priority || filters.priority === "all" || task.priority === filters.priority;

      const matchesAssignee =
        !filters.assignee || filters.assignee === "all" || task.assignee === filters.assignee;

      return matchesQuery && matchesStatus && matchesPriority && matchesAssignee;
    });
  }

  // --- Статистика ---
  const getStats = () => {
    return {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "todo").length,
      inprogress: tasks.filter((t) => t.status === "inprogress").length,
      done: tasks.filter((t) => t.status === "done").length,
    };
  };

  const getUserTasks = (userId: number) => {
    return tasks.filter((t) => t.createdBy === userId);
  };

  const getUserStats = (userId: number) => {
    const userTasks = getUserTasks(userId);
    return {
      total: userTasks.length,
      todo: userTasks.filter((t) => t.status === "todo").length,
      inprogress: userTasks.filter((t) => t.status === "inprogress").length,
      done: userTasks.filter((t) => t.status === "done").length,
    };
  };

  // Возвращаем наружу
  return {
    tasks,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    moveTask,
    getStats,
    getUserTasks,
    getUserStats,
    getFilteredTasks, // 🔹 теперь доступна
  };
}
