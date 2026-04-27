"use client";

import { useState, useEffect } from "react";
import { useNotifications } from "./useNotifications";
console.log('📧 [DEBUG] process.env.NEXT_PUBLIC_EMAIL_ENABLED =', process.env.NEXT_PUBLIC_EMAIL_ENABLED);

// Добавьте это после импортов
type EmailType = 
  | 'task-created'
  | 'task-updated'
  | 'task-completed'
  | 'deadline-soon'
  | 'task-overdue'
  | 'test';

export type Task = {
  id: number;
  title: string;
  description: string;
  status: "todo" | "inprogress" | "done";
  priority: "low" | "medium" | "high";
  assignee: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
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

// 2. Второй useEffect - для localStorage
useEffect(() => {
  if (typeof window !== 'undefined' && isInitialized) {
    localStorage.setItem('bug-tracker-tasks', JSON.stringify(tasks));
  }
}, [tasks, isInitialized]);

// 3. Третий useEffect - для проверки дедлайнов (email)
useEffect(() => {
  if (typeof window !== 'undefined' && 
      process.env.NEXT_PUBLIC_EMAIL_ENABLED === 'true' && 
      isInitialized) {
    console.log('⏰ Начинаем проверку дедлайнов...');
    checkDeadlines();
    
    const interval = setInterval(checkDeadlines, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }
}, [tasks, isInitialized]); // ← Эта строка правильная

  // 🔄 API функции
  const apiRequest = async (url: string, options: RequestInit = {}) => {
    try {
      const token = localStorage.getItem('bug-tracker-token');
      
      const response = await fetch(`/api${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
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
// 🔥 НОВЫЕ ФУНКЦИИ ДЛЯ EMAIL ======================

// Функция для поиска пользователя по имени
const findUserByUsername = async (username: string) => {
  try {
    const users = await fetch('/api/users').then(res => res.json());
    return users.find((user: any) => user.username === username);
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
};

// Основная функция отправки email
const sendEmailNotification = async (type: EmailType, data: any, assigneeEmail?: string) => {
  // ТОЛЬКО проверка на серверный рендеринг
  if (typeof window === 'undefined') {
    console.log(`📧 Server-side, skipping`);
    return null;
  }

  // 🔥 ИСПРАВЛЕННАЯ ГЕНЕРАЦИЯ EMAIL ===================
  
  // Сначала проверяем пропуск некорректных имен
  const skipNames = ['Главный Администратор', 'Не назначен', '', null, undefined];
  if (skipNames.includes(data.assignee)) {
    console.log(`📧 Пропускаем email для '${data.assignee}'`);
    return null;
  }

  // Функция для получения фиксированного email
  const getFixedEmail = (name: string) => {
    const emailMap: Record<string, string> = {
      'Главный Администратор': 'admin@ethereal.email',
      'Иван Иванов': 'ivan.ivanov@ethereal.email',
      'Петр Петров': 'petr.petrov@ethereal.email',
      'Мария Сидорова': 'maria.sidorova@ethereal.email',
      'Алексей Алексеев': 'alexey.alexeev@ethereal.email',
      'Новый пользователь': 'new.user@ethereal.email',
      'Тестовый пользователь': 'test.user@ethereal.email'
    };
    
    return emailMap[name] || 'user@ethereal.email';
  };

  // Генерация email
  let emailToSend = assigneeEmail;
  
  // Если нет email или это не email
  if (!emailToSend || !emailToSend.includes('@')) {
    // Используем фиксированный email
    emailToSend = getFixedEmail(data.assignee || 'user');
    console.log(`📧 Фиксированный email для '${data.assignee}': ${emailToSend}`);
  }

  // Дополнительная проверка
  if (!emailToSend || !emailToSend.includes('@')) {
    console.error(`❌ Некорректный email: ${emailToSend}, skipping`);
    return null;
  }

  // ===================================================

  try {
    console.log(`📧 [${type}] Отправляем на: ${emailToSend}`);
    console.log(`📧 Данные:`, data);
    
    // 📦 СТАРЫЙ ФОРМАТ для совместимости с API
    const requestBody = {
  to: emailToSend,
  type: type, // 'task-created', 'task-updated', etc.
  data: {
    taskId: data.taskId || `task-${Date.now()}`,
    taskTitle: data.taskTitle || data.title || 'Задача без названия',
    taskDescription: data.taskDescription || data.description || '',
    priority: data.priority || 'medium',
    assignee: assigneeName,
    status: data.status || 'todo',
    deadline: data.deadline,
    // Дополнительные поля для совместимости
    id: data.taskId || `task-${Date.now()}`,
    title: data.taskTitle || data.title || 'Задача без названия',
    description: data.taskDescription || data.description || '',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    updatedBy: 'system'
  }
};

    console.log('📧 Отправляемые данные (старый формат):', requestBody);
    
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Email API error: ${response.status}`);
    }

    const result = await response.json();
    console.log(`✅ Email (${type}) отправлен:`, result.messageId);
    
    if (result.previewUrl) {
      console.log(`👀 Preview: ${result.previewUrl}`);
      // Автоматически открываем в новой вкладке для тестирования
      if (type === 'test' || type === 'task-created') {
        window.open(result.previewUrl, '_blank');
      }
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Ошибка отправки email (${type}):`, error);
    return null;
  }
};

// Функция для проверки дедлайнов
const checkDeadlines = async () => {
  if (process.env.NEXT_PUBLIC_EMAIL_ENABLED !== 'true') {
    return;
  }

  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  tasks.forEach(async (task) => {
    if (!task.deadline || task.status === 'done') return;

    const deadline = new Date(task.deadline);
    
    // Проверка "скоро дедлайн" (менее 24 часов)
    if (deadline > now && deadline <= in24Hours) {
      await sendEmailNotification('deadline-soon', {
        taskId: task.id,
        taskTitle: task.title,
        deadline: task.deadline,
        assignee: task.assignee
      }, task.assignee);
    }

    // Проверка просроченных задач
    if (deadline < now && task.status !== 'done') {
      const overdueDays = Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
      await sendEmailNotification('task-overdue', {
        taskId: task.id,
        taskTitle: task.title,
        deadline: task.deadline,
        overdueBy: `${overdueDays} дней`,
        assignee: task.assignee
      }, task.assignee);
    }
  });
};


  // ✅ Создание задачи (dual-write)
const createTask = async (
  taskData: Omit<Task, "id" | "createdAt" | "updatedAt">,
  userId: string
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
  console.log('📌 Assignee для email:', taskData.assignee);

  // 🔥 EMAIL: Отправляем улучшенное уведомление
  console.log('🔍 Проверка окружения:');
  console.log('  - window доступен:', typeof window !== 'undefined');
  console.log('  - EMAIL_ENABLED:', process.env.NEXT_PUBLIC_EMAIL_ENABLED);
  console.log('  - Режим:', process.env.NODE_ENV);

  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_EMAIL_ENABLED === 'true') {
    console.log('=== 📧 ОТПРАВКА EMAIL (НОВАЯ ВЕРСИЯ) ===');
    
    // 🔧 ИСПРАВЛЕННАЯ ГЕНЕРАЦИЯ EMAIL
    const getFixedEmailForAssignee = (assigneeName: string) => {
      const emailMap: Record<string, string> = {
        'Тестовый пользователь': 'test.user@ethereal.email',
        'Новый пользователь': 'new.user@ethereal.email',
        'Иван Иванов': 'ivan.ivanov@ethereal.email',
        'Петр Петров': 'petr.petrov@ethereal.email',
        'Мария Сидорова': 'maria.sidorova@ethereal.email',
        'Алексей Алексеев': 'alexey.alexeev@ethereal.email',
        'Администратор': 'admin@ethereal.email',
        'Главный Администратор': 'admin@ethereal.email'
      };
      
      // Ищем точное совпадение
      if (emailMap[assigneeName]) {
        return emailMap[assigneeName];
      }
      
      // Ищем частичное совпадение (без учета регистра)
      const lowerAssignee = assigneeName.toLowerCase();
      for (const [key, value] of Object.entries(emailMap)) {
        if (key.toLowerCase().includes(lowerAssignee) || 
            lowerAssignee.includes(key.toLowerCase())) {
          return value;
        }
      }
      
      // Fallback: простой email из имени
      return `${assigneeName.toLowerCase()
        .replace(/\s+/g, '.')
        .replace(/[^a-zа-яё0-9.]/g, '') // Разрешаем кириллицу
        .replace(/[а-яё]/g, char => {
          // Простая транслитерация для кириллицы
          const map: Record<string, string> = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
            'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
            'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
            'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
            'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
          };
          return map[char] || '';
        })
        .replace(/\.+/g, '.')
        .replace(/^\.|\.$/g, '')}@ethereal.email`;
    };

    // Получаем email
    const assigneeEmail = getFixedEmailForAssignee(taskData.assignee || 'user');
    console.log(`📧 Email для '${taskData.assignee}': ${assigneeEmail}`);

    // Проверяем валидность email перед отправкой
    if (!assigneeEmail || !assigneeEmail.includes('@') || assigneeEmail === '.@ethereal.email') {
      console.warn('⚠️ Некорректный email, пропускаем отправку');
    } else {
      console.log(`📧 Отправляем 'task-created' на: ${assigneeEmail}`);
      
      // Асинхронно отправляем, но не ждем
      sendEmailNotification('task-created', {
        taskId: taskId,
        taskTitle: taskData.title,
        taskDescription: taskData.description,
        assignee: taskData.assignee,
        priority: taskData.priority,
        deadline: taskData.deadline,
        status: taskData.status || 'todo'
      }, assigneeEmail).then(result => {
        if (result) {
          console.log('✅ Email отправлен успешно');
          console.log('👀 Preview:', result.previewUrl);
          if (result.previewUrl) {
            window.open(result.previewUrl, '_blank');
          }
        }
      }).catch(err => {
        console.error('❌ Ошибка при отправке email:', err);
      });
    } // ← Закрываем else блока проверки email
    
  } else { // ← Это else для ПЕРВОГО if (проверка window и EMAIL_ENABLED)
    console.log('📧 Email отправка отключена или серверный рендеринг');
  }

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
    
    if (!taskToUpdate) {
      console.warn('❌ Задача не найдена:', id);
      return;
    }

    console.log('🔄 Обновление задачи:', id, updatedFields);

    // 1. Локальное обновление (мгновенно)
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, ...updatedFields, updatedAt: new Date() } : task
      )
    );

    addNotification(`Задача обновлена: ${taskToUpdate.title}`, "task");

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
  // ✅ Обновление задачи с email уведомлениями
const updateTaskWithNotification = async (
  id: number, 
  updatedFields: Partial<Task>, 
  userId: string
) => {
  const taskToUpdate = tasks.find(t => t.id === id);
  
  if (!taskToUpdate) {
    console.warn('❌ Задача не найдена:', id);
    return;
  }

  console.log('🔄 Обновление задачи с уведомлением:', id, updatedFields);

  // Проверяем изменения для email уведомления
  const changes = {
    status: updatedFields.status !== taskToUpdate.status ? 
      { old: taskToUpdate.status, new: updatedFields.status } : null,
    priority: updatedFields.priority !== taskToUpdate.priority ? 
      { old: taskToUpdate.priority, new: updatedFields.priority } : null,
    assignee: updatedFields.assignee !== taskToUpdate.assignee ? 
      { old: taskToUpdate.assignee, new: updatedFields.assignee } : null
  };

  // 1. Локальное обновление (мгновенно)
  setTasks((prev) =>
    prev.map((task) =>
      task.id === id ? { ...task, ...updatedFields, updatedAt: new Date() } : task
    )
  );

  addNotification(`Задача обновлена: ${taskToUpdate.title}`, "task");

  // 2. Отправляем email если есть изменения
  const hasChanges = Object.values(changes).some(change => change !== null);
  
  if (hasChanges && process.env.NEXT_PUBLIC_EMAIL_ENABLED === 'true') {
    // Определяем тип email
    let emailType: EmailType = 'task-updated';
    if (updatedFields.status === 'done' && taskToUpdate.status !== 'done') {
      emailType = 'task-completed';
    }

    // Определяем получателя
    const recipient = updatedFields.assignee || taskToUpdate.assignee;
    
    if (recipient) {
      const assigneeEmail = `${recipient.toLowerCase()
        .replace(/\s+/g, '.')
        .replace(/[^a-z0-9.]/g, '')}@ethereal.email`;

      await sendEmailNotification(emailType, {
        taskId: id,
        taskTitle: updatedFields.title || taskToUpdate.title,
        oldStatus: taskToUpdate.status,
        newStatus: updatedFields.status,
        oldPriority: taskToUpdate.priority,
        newPriority: updatedFields.priority,
        oldAssignee: taskToUpdate.assignee,
        newAssignee: updatedFields.assignee,
        deadline: updatedFields.deadline || taskToUpdate.deadline,
        updatedBy: userId
      }, assigneeEmail);
    }
  }

  // 3. API обновление (асинхронно)
  try {
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
  const getUserTasks = (userId: string) => {
    return tasks.filter((t) => t.createdBy === userId || t.assignee === String(userId));
  };

  // ✅ Статистика конкретного пользователя
  const getUserStats = (userId: string) => {
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
  updateTaskWithNotification, // ← ДОБАВЬТЕ ЭТО
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
  loadTasksFromAPI,
  checkDeadlines // ← ДОБАВЬТЕ ЭТО (опционально, для тестов)
};