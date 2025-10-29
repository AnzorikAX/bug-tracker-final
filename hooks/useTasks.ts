"use client";

import { useState, useEffect } from "react";
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
  createdBy?: string;  // ← ИЗМЕНИЛ НА string
  deadline: Date | null;
};

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bug-tracker-tasks');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          deadline: task.deadline ? new Date(task.deadline) : null
        }));
      }
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { addNotification } = useNotifications();

  // 🔄 Загружаем задачи из API при первом рендере
  useEffect(() => {
    if (!isInitialized) {
      loadTasksFromAPI();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Сохраняем задачи в localStorage при каждом изменении
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      localStorage.setItem('bug-tracker-tasks', JSON.stringify(tasks));
    }
  }, [tasks, isInitialized]);

  // 🔄 API функции
  const apiRequest = async (url: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(`/api${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  };

  // 🔄 Загрузка задач с API
  const loadTasksFromAPI = async (): Promise<Task[]> => {
    setIsLoading(true);
    try {
      const result = await apiRequest('/tasks');
      if (result.success && result.data) {
        // Конвертируем API задачи в наш формат
        const apiTasks: Task[] = result.data.map((apiTask: any) => {
          // Конвертируем статус из API формата в наш формат
          let status: Task['status'] = 'todo';
          if (apiTask.status === 'in-progress') status = 'inprogress';
          else if (apiTask.status === 'done') status = 'done';
          else status = apiTask.status as Task['status'];

          // Конвертируем ID из строки в число (берем только цифры)
          const idMatch = apiTask.id.match(/\d+/);
          const id = idMatch ? parseInt(idMatch[0]) : Date.now();

          return {
            id: id,
            title: apiTask.title,
            description: apiTask.description || '',
            status: status,
            priority: apiTask.priority as Task['priority'],
            assignee: apiTask.assigneeName || apiTask.assignee || 'Не назначен',
            createdAt: new Date(apiTask.createdAt),
            updatedAt: new Date(apiTask.updatedAt),
            deadline: apiTask.dueDate ? new Date(apiTask.dueDate) : null
          };
        });

        setTasks(apiTasks);
        console.log('✅ Загружено задач из API:', apiTasks.length);
        return apiTasks;
      }
    } catch (error) {
      console.warn('⚠️ Не удалось загрузить задачи из API, используем локальные данные');
    } finally {
      setIsLoading(false);
    }
    return tasks;
  };

  // ✅ Создание задачи (dual-write)
  const createTask = async (
    taskData: Omit<Task, "id" | "createdAt" | "updatedAt">,
    userId: string  // ← ИСПРАВЛЕНО НА string
  ) => {
    const taskId = Date.now();
    const newTask: Task = {
      ...taskData,
      id: taskId,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    };

    console.log('🔄 Создание задачи:', newTask);

    // 1. Локальное обновление (мгновенно)
    setTasks((prev) => [...prev, newTask]);
    addNotification(`Создана новая задача: ${taskData.title}`, "task");

    // 2. API обновление (асинхронно)
    try {
      await apiRequest('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          assignee: taskData.assignee,
          dueDate: taskData.deadline?.toISOString(),
          tags: ['bug-tracker']
        })
      });
      console.log('✅ Задача синхронизирована с API');
      
      // 3. После успешного создания в API, обновляем локальное состояние с данными из API
      setTimeout(async () => {
        try {
          const updatedTasks = await loadTasksFromAPI();
          console.log('✅ Локальное состояние обновлено из API');
          
          // Находим нашу новую задачу в обновленном списке
          const foundTask = updatedTasks.find(task => 
            task.title === newTask.title && 
            task.description === newTask.description
          );
          
          if (foundTask) {
            console.log('✅ Новая задача найдена в API:', foundTask.id);
          }
        } catch (error) {
          console.warn('⚠️ Не удалось обновить из API, но задача сохранена локально');
        }
      }, 1000);
      
    } catch (error) {
      console.warn('⚠️ Не удалось синхронизировать задачу с API, сохраняем локально');
    }

    return newTask;
  };

  // ✅ Обновление задачи (dual-write)
  const updateTask = async (id: number, updatedFields: Partial<Task>) => {
    const taskToUpdate = tasks.find(t => t.id === id);
    
    console.log('🔄 Обновление задачи:', id, updatedFields);

    // 1. Локальное обновление (мгновенно)
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, ...updatedFields, updatedAt: new Date() } : task
      )
    );

    if (taskToUpdate) {
      addNotification(`Задача обновлена: ${taskToUpdate.title}`, "task");
    }

    // 2. API обновление (асинхронно)
    try {
      // Конвертируем статус обратно в API формат
      const apiStatus = updatedFields.status === 'inprogress' ? 'in-progress' : updatedFields.status;

      await apiRequest(`/tasks/task-${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: updatedFields.title,
          description: updatedFields.description,
          status: apiStatus,
          priority: updatedFields.priority,
          assignee: updatedFields.assignee,
          dueDate: updatedFields.deadline?.toISOString()
        })
      });
      console.log('✅ Обновление задачи синхронизировано с API');
    } catch (error) {
      console.warn('⚠️ Не удалось синхронизировать обновление с API, сохраняем локально');
    }
  };

  // ✅ Удаление задачи (dual-write)
  const deleteTask = async (id: number) => {
    const deletedTask = tasks.find((t) => t.id === id);
    
    console.log('🔄 Удаление задачи:', id);

    // 1. Локальное удаление (мгновенно)
    setTasks((prev) => prev.filter((task) => task.id !== id));

    if (deletedTask) {
      addNotification(`Задача удалена: ${deletedTask.title}`, "task");
    }

    // 2. API удаление (асинхронно)
    try {
      await apiRequest(`/tasks/task-${id}`, {
        method: 'DELETE'
      });
      console.log('✅ Удаление задачи синхронизировано с API');
    } catch (error) {
      console.warn('⚠️ Не удалось синхронизировать удаление с API, удаляем локально');
    }
  };

  // ✅ Перемещение задачи (dual-write)
  const moveTask = async (id: number, newStatus: Task["status"]) => {
    const movedTask = tasks.find((t) => t.id === id);
    
    console.log('🔄 Перемещение задачи:', id, newStatus);

    // 1. Локальное обновление (мгновенно)
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, status: newStatus, updatedAt: new Date() } : task
      )
    );

    if (movedTask) {
      addNotification(`Задача перемещена: ${movedTask.title}`, "task");
    }

    // 2. API обновление (асинхронно)
    try {
      // Конвертируем статус обратно в API формат
      const apiStatus = newStatus === 'inprogress' ? 'in-progress' : newStatus;

      await apiRequest(`/tasks/task-${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: apiStatus
        })
      });
      console.log('✅ Перемещение задачи синхронизировано с API');
    } catch (error) {
      console.warn('⚠️ Не удалось синхронизировать перемещение с API, сохраняем локально');
    }
  };

  // ✅ Статистика
  const getStats = () => {
    const now = new Date();
    const highPriority = tasks.filter(t => t.priority === 'high').length;
    const mediumPriority = tasks.filter(t => t.priority === 'medium').length;
    const lowPriority = tasks.filter(t => t.priority === 'low').length;
    
    const tasksWithDeadline = tasks.filter(t => t.deadline !== null);
    const overdueTasks = tasksWithDeadline.filter(t => 
      t.deadline && new Date(t.deadline) < now && t.status !== 'done'
    ).length;
    const upcomingTasks = tasksWithDeadline.filter(t => 
      t.deadline && new Date(t.deadline) > now && new Date(t.deadline) <= new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    ).length;
    
    return {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inprogress: tasks.filter(t => t.status === 'inprogress').length,
      done: tasks.filter(t => t.status === 'done').length,
      highPriority,
      mediumPriority,
      lowPriority,
      overdueTasks,
      upcomingTasks
    };
  };

  // ✅ Фильтрация задач
  const getFilteredTasks = (
    filters: { 
      query?: string; 
      priority?: string; 
      status?: string; 
      assignee?: string;
      deadline?: string;
    },
    sourceTasks: Task[] = tasks
  ) => {
    const now = new Date();
    
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

      const matchesDeadline = (() => {
        if (!filters.deadline || filters.deadline === "all") return true;
        
        if (!task.deadline) return filters.deadline === "no-deadline";
        
        const taskDeadline = new Date(task.deadline);
        
        switch (filters.deadline) {
          case "overdue":
            return taskDeadline < now && task.status !== 'done';
          case "today":
            const today = new Date();
            return taskDeadline.toDateString() === today.toDateString();
          case "upcoming":
            return taskDeadline > now && taskDeadline <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          case "future":
            return taskDeadline > now;
          default:
            return true;
        }
      })();

      return matchesQuery && matchesPriority && matchesStatus && matchesAssignee && matchesDeadline;
    });
  };

  // ✅ Задачи конкретного пользователя
  const getUserTasks = (userId: string) => {  // ← ИСПРАВЛЕНО НА string
    return tasks.filter((t) => t.createdBy === userId || t.assignee === String(userId));
  };

  // ✅ Статистика конкретного пользователя
  const getUserStats = (userId: string) => {  // ← ИСПРАВЛЕНО НА string
    const userTasks = getUserTasks(userId);
    const now = new Date();
    const overdue = userTasks.filter(t => 
      t.deadline && new Date(t.deadline) < now && t.status !== 'done'
    ).length;
    
    return {
      total: userTasks.length,
      done: userTasks.filter((t) => t.status === "done").length,
      overdue
    };
  };

  // ✅ Очистка всех задач
  const clearAllTasks = () => {
    setTasks([]);
    addNotification('Все задачи были очищены', 'system');
  };

  // ✅ Восстановление демо-данных
  const restoreDemoData = () => {
    const demoTasks: Task[] = [
      {
        id: 1,
        title: 'Исправить баг с авторизацией',
        description: 'Пользователи не могут войти в систему после обновления',
        status: 'inprogress',
        priority: 'high',
        assignee: 'Иван Иванов',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-16'),
        deadline: new Date('2024-02-01')
      },
      {
        id: 2,
        title: 'Добавить темную тему',
        description: 'Реализовать переключение между светлой и темной темой',
        status: 'todo',
        priority: 'medium',
        assignee: 'Петр Петров',
        createdAt: new Date('2024-01-14'),
        updatedAt: new Date('2024-01-14'),
        deadline: new Date('2024-01-25')
      },
      {
        id: 3,
        title: 'Оптимизировать загрузку страниц',
        description: 'Увеличить производительность приложения',
        status: 'done',
        priority: 'low',
        assignee: 'Мария Сидорова',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-12'),
        deadline: new Date('2024-01-15')
      },
      {
        id: 4,
        title: 'Реализовать систему дедлайнов',
        description: 'Добавить возможность установки сроков выполнения задач',
        status: 'todo',
        priority: 'high',
        assignee: 'Алексей Алексеев',
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-18'),
        deadline: new Date('2024-01-20')
      }
    ];
    
    setTasks(demoTasks);
    addNotification('Демо-данные восстановлены', 'system');
  };

  // ✅ Экспорт задач
  const exportTasks = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `bug-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addNotification('Данные экспортированы', 'system');
  };

  // ✅ Вспомогательная функция для проверки дедлайна
  const getDeadlineStatus = (task: Task): 'normal' | 'warning' | 'danger' | 'completed' => {
    if (task.status === 'done') return 'completed';
    if (!task.deadline) return 'normal';
    
    const now = new Date();
    const deadline = new Date(task.deadline);
    const timeDiff = deadline.getTime() - now.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    
    if (daysDiff < 0) return 'danger';
    if (daysDiff <= 1) return 'danger';
    if (daysDiff <= 3) return 'warning';
    
    return 'normal';
  };

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    getStats,
    getFilteredTasks,
    getUserTasks,
    getUserStats,
    clearAllTasks,
    restoreDemoData,
    exportTasks,
    getDeadlineStatus,
    loadTasksFromAPI
  };
}