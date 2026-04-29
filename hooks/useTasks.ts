"use client";

import { useState, useEffect } from "react";
import { useNotifications } from "./useNotifications";
console.log('рџ“§ [DEBUG] process.env.NEXT_PUBLIC_EMAIL_ENABLED =', process.env.NEXT_PUBLIC_EMAIL_ENABLED);

// Р”РѕР±Р°РІСЊС‚Рµ СЌС‚Рѕ РїРѕСЃР»Рµ РёРјРїРѕСЂС‚РѕРІ
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
  discussionCount?: number;
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

  // рџ”„ Р—Р°РіСЂСѓР¶Р°РµРј Р·Р°РґР°С‡Рё РёР· API РїСЂРё РїРµСЂРІРѕРј СЂРµРЅРґРµСЂРµ
  useEffect(() => {
  if (!isInitialized) {
    loadTasksFromAPI();
    setIsInitialized(true);
  }
}, [isInitialized]);

// 2. Р’С‚РѕСЂРѕР№ useEffect - РґР»СЏ localStorage
useEffect(() => {
  if (typeof window !== 'undefined' && isInitialized) {
    localStorage.setItem('bug-tracker-tasks', JSON.stringify(tasks));
  }
}, [tasks, isInitialized]);

// 3. РўСЂРµС‚РёР№ useEffect - РґР»СЏ РїСЂРѕРІРµСЂРєРё РґРµРґР»Р°Р№РЅРѕРІ (email)
useEffect(() => {
  if (typeof window !== 'undefined' && 
      process.env.NEXT_PUBLIC_EMAIL_ENABLED === 'true' && 
      isInitialized) {
    console.log('вЏ° РќР°С‡РёРЅР°РµРј РїСЂРѕРІРµСЂРєСѓ РґРµРґР»Р°Р№РЅРѕРІ...');
    checkDeadlines();
    
    const interval = setInterval(checkDeadlines, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }
}, [tasks, isInitialized]); // в†ђ Р­С‚Р° СЃС‚СЂРѕРєР° РїСЂР°РІРёР»СЊРЅР°СЏ

  // рџ”„ API С„СѓРЅРєС†РёРё
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

  // рџ”„ Р—Р°РіСЂСѓР·РєР° Р·Р°РґР°С‡ СЃ API
  const loadTasksFromAPI = async (): Promise<Task[]> => {
    setIsLoading(true);
    try {
      const result = await apiRequest('/tasks');
      if (result.success && result.data) {
        // РљРѕРЅРІРµСЂС‚РёСЂСѓРµРј API Р·Р°РґР°С‡Рё РІ РЅР°С€ С„РѕСЂРјР°С‚
        const apiTasks: Task[] = result.data.map((apiTask: any) => {
          // РљРѕРЅРІРµСЂС‚РёСЂСѓРµРј СЃС‚Р°С‚СѓСЃ РёР· API С„РѕСЂРјР°С‚Р° РІ РЅР°С€ С„РѕСЂРјР°С‚
          let status: Task['status'] = 'todo';
          if (apiTask.status === 'in-progress') status = 'inprogress';
          else if (apiTask.status === 'done') status = 'done';
          else status = apiTask.status as Task['status'];

          // РљРѕРЅРІРµСЂС‚РёСЂСѓРµРј ID РёР· СЃС‚СЂРѕРєРё РІ С‡РёСЃР»Рѕ (Р±РµСЂРµРј С‚РѕР»СЊРєРѕ С†РёС„СЂС‹)
          const idMatch = apiTask.id.match(/\d+/);
          const id = idMatch ? parseInt(idMatch[0]) : Date.now();

          return {
            id: id,
            title: apiTask.title,
            description: apiTask.description || '',
            status: status,
            priority: apiTask.priority as Task['priority'],
            assignee: apiTask.assigneeName || apiTask.assignee || 'РќРµ РЅР°Р·РЅР°С‡РµРЅ',
            createdAt: new Date(apiTask.createdAt),
            updatedAt: new Date(apiTask.updatedAt),
            deadline: apiTask.dueDate ? new Date(apiTask.dueDate) : null,
            discussionCount: Number(apiTask.discussionCount || 0),
          };
        });

        setTasks(apiTasks);
        console.log('вњ… Р—Р°РіСЂСѓР¶РµРЅРѕ Р·Р°РґР°С‡ РёР· API:', apiTasks.length);
        return apiTasks;
      }
    } catch (error) {
      console.warn('вљ пёЏ РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ Р·Р°РґР°С‡Рё РёР· API, РёСЃРїРѕР»СЊР·СѓРµРј Р»РѕРєР°Р»СЊРЅС‹Рµ РґР°РЅРЅС‹Рµ');
    } finally {
      setIsLoading(false);
    }
    return tasks;
  };
// рџ”Ґ РќРћР’Р«Р• Р¤РЈРќРљР¦РР Р”Р›РЇ EMAIL ======================

// Р¤СѓРЅРєС†РёСЏ РґР»СЏ РїРѕРёСЃРєР° РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ РїРѕ РёРјРµРЅРё
const findUserByUsername = async (username: string) => {
  try {
    const users = await fetch('/api/users').then(res => res.json());
    return users.find((user: any) => user.username === username);
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
};

// РћСЃРЅРѕРІРЅР°СЏ С„СѓРЅРєС†РёСЏ РѕС‚РїСЂР°РІРєРё email
const sendEmailNotification = async (type: EmailType, data: any, assigneeEmail?: string) => {
  // РўРћР›Р¬РљРћ РїСЂРѕРІРµСЂРєР° РЅР° СЃРµСЂРІРµСЂРЅС‹Р№ СЂРµРЅРґРµСЂРёРЅРі
  if (typeof window === 'undefined') {
    console.log(`рџ“§ Server-side, skipping`);
    return null;
  }

  // рџ”Ґ РРЎРџР РђР’Р›Р•РќРќРђРЇ Р“Р•РќР•Р РђР¦РРЇ EMAIL ===================
  
  // РЎРЅР°С‡Р°Р»Р° РїСЂРѕРІРµСЂСЏРµРј РїСЂРѕРїСѓСЃРє РЅРµРєРѕСЂСЂРµРєС‚РЅС‹С… РёРјРµРЅ
  const skipNames = ['Р“Р»Р°РІРЅС‹Р№ РђРґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂ', 'РќРµ РЅР°Р·РЅР°С‡РµРЅ', '', null, undefined];
  if (skipNames.includes(data.assignee)) {
    console.log(`рџ“§ РџСЂРѕРїСѓСЃРєР°РµРј email РґР»СЏ '${data.assignee}'`);
    return null;
  }

  // Р¤СѓРЅРєС†РёСЏ РґР»СЏ РїРѕР»СѓС‡РµРЅРёСЏ С„РёРєСЃРёСЂРѕРІР°РЅРЅРѕРіРѕ email
  const getFixedEmail = (name: string) => {
    const emailMap: Record<string, string> = {
      'Р“Р»Р°РІРЅС‹Р№ РђРґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂ': 'admin@ethereal.email',
      'РРІР°РЅ РРІР°РЅРѕРІ': 'ivan.ivanov@ethereal.email',
      'РџРµС‚СЂ РџРµС‚СЂРѕРІ': 'petr.petrov@ethereal.email',
      'РњР°СЂРёСЏ РЎРёРґРѕСЂРѕРІР°': 'maria.sidorova@ethereal.email',
      'РђР»РµРєСЃРµР№ РђР»РµРєСЃРµРµРІ': 'alexey.alexeev@ethereal.email',
      'РќРѕРІС‹Р№ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ': 'new.user@ethereal.email',
      'РўРµСЃС‚РѕРІС‹Р№ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ': 'test.user@ethereal.email'
    };
    
    return emailMap[name] || 'user@ethereal.email';
  };

  // Р“РµРЅРµСЂР°С†РёСЏ email
  let emailToSend = assigneeEmail;
  
  // Р•СЃР»Рё РЅРµС‚ email РёР»Рё СЌС‚Рѕ РЅРµ email
  if (!emailToSend || !emailToSend.includes('@')) {
    // РСЃРїРѕР»СЊР·СѓРµРј С„РёРєСЃРёСЂРѕРІР°РЅРЅС‹Р№ email
    emailToSend = getFixedEmail(data.assignee || 'user');
    console.log(`рџ“§ Р¤РёРєСЃРёСЂРѕРІР°РЅРЅС‹Р№ email РґР»СЏ '${data.assignee}': ${emailToSend}`);
  }

  // Р”РѕРїРѕР»РЅРёС‚РµР»СЊРЅР°СЏ РїСЂРѕРІРµСЂРєР°
  if (!emailToSend || !emailToSend.includes('@')) {
    console.error(`вќЊ РќРµРєРѕСЂСЂРµРєС‚РЅС‹Р№ email: ${emailToSend}, skipping`);
    return null;
  }

  // ===================================================

  try {
    console.log(`рџ“§ [${type}] РћС‚РїСЂР°РІР»СЏРµРј РЅР°: ${emailToSend}`);
    console.log(`рџ“§ Р”Р°РЅРЅС‹Рµ:`, data);
    
    // рџ“¦ РЎРўРђР Р«Р™ Р¤РћР РњРђРў РґР»СЏ СЃРѕРІРјРµСЃС‚РёРјРѕСЃС‚Рё СЃ API
    const requestBody = {
  to: emailToSend,
  type: type, // 'task-created', 'task-updated', etc.
  data: {
    taskId: data.taskId || `task-${Date.now()}`,
    taskTitle: data.taskTitle || data.title || 'Р—Р°РґР°С‡Р° Р±РµР· РЅР°Р·РІР°РЅРёСЏ',
    taskDescription: data.taskDescription || data.description || '',
    priority: data.priority || 'medium',
    assignee: data.assignee || 'Не назначен',
    status: data.status || 'todo',
    deadline: data.deadline,
    // Р”РѕРїРѕР»РЅРёС‚РµР»СЊРЅС‹Рµ РїРѕР»СЏ РґР»СЏ СЃРѕРІРјРµСЃС‚РёРјРѕСЃС‚Рё
    id: data.taskId || `task-${Date.now()}`,
    title: data.taskTitle || data.title || 'Р—Р°РґР°С‡Р° Р±РµР· РЅР°Р·РІР°РЅРёСЏ',
    description: data.taskDescription || data.description || '',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    updatedBy: 'system'
  }
};

    console.log('рџ“§ РћС‚РїСЂР°РІР»СЏРµРјС‹Рµ РґР°РЅРЅС‹Рµ (СЃС‚Р°СЂС‹Р№ С„РѕСЂРјР°С‚):', requestBody);
    
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Email API error: ${response.status}`);
    }

    const result = await response.json();
    console.log(`вњ… Email (${type}) РѕС‚РїСЂР°РІР»РµРЅ:`, result.messageId);
    
    if (result.previewUrl) {
      console.log(`рџ‘Ђ Preview: ${result.previewUrl}`);
      // РђРІС‚РѕРјР°С‚РёС‡РµСЃРєРё РѕС‚РєСЂС‹РІР°РµРј РІ РЅРѕРІРѕР№ РІРєР»Р°РґРєРµ РґР»СЏ С‚РµСЃС‚РёСЂРѕРІР°РЅРёСЏ
      if (type === 'test' || type === 'task-created') {
        window.open(result.previewUrl, '_blank');
      }
    }
    
    return result;
  } catch (error) {
    console.error(`вќЊ РћС€РёР±РєР° РѕС‚РїСЂР°РІРєРё email (${type}):`, error);
    return null;
  }
};

// Р¤СѓРЅРєС†РёСЏ РґР»СЏ РїСЂРѕРІРµСЂРєРё РґРµРґР»Р°Р№РЅРѕРІ
const checkDeadlines = async () => {
  if (process.env.NEXT_PUBLIC_EMAIL_ENABLED !== 'true') {
    return;
  }

  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  tasks.forEach(async (task) => {
    if (!task.deadline || task.status === 'done') return;

    const deadline = new Date(task.deadline);
    
    // РџСЂРѕРІРµСЂРєР° "СЃРєРѕСЂРѕ РґРµРґР»Р°Р№РЅ" (РјРµРЅРµРµ 24 С‡Р°СЃРѕРІ)
    if (deadline > now && deadline <= in24Hours) {
      await sendEmailNotification('deadline-soon', {
        taskId: task.id,
        taskTitle: task.title,
        deadline: task.deadline,
        assignee: task.assignee
      }, task.assignee);
    }

    // РџСЂРѕРІРµСЂРєР° РїСЂРѕСЃСЂРѕС‡РµРЅРЅС‹С… Р·Р°РґР°С‡
    if (deadline < now) {
      const overdueDays = Math.floor((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
      await sendEmailNotification('task-overdue', {
        taskId: task.id,
        taskTitle: task.title,
        deadline: task.deadline,
        overdueBy: `${overdueDays} РґРЅРµР№`,
        assignee: task.assignee
      }, task.assignee);
    }
  });
};


  // вњ… РЎРѕР·РґР°РЅРёРµ Р·Р°РґР°С‡Рё (dual-write)
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

  console.log('рџ”„ РЎРѕР·РґР°РЅРёРµ Р·Р°РґР°С‡Рё:', newTask);
  console.log('рџ“Њ Assignee РґР»СЏ email:', taskData.assignee);

  // рџ”Ґ EMAIL: РћС‚РїСЂР°РІР»СЏРµРј СѓР»СѓС‡С€РµРЅРЅРѕРµ СѓРІРµРґРѕРјР»РµРЅРёРµ
  console.log('рџ”Ќ РџСЂРѕРІРµСЂРєР° РѕРєСЂСѓР¶РµРЅРёСЏ:');
  console.log('  - window РґРѕСЃС‚СѓРїРµРЅ:', typeof window !== 'undefined');
  console.log('  - EMAIL_ENABLED:', process.env.NEXT_PUBLIC_EMAIL_ENABLED);
  console.log('  - Р РµР¶РёРј:', process.env.NODE_ENV);

  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_EMAIL_ENABLED === 'true') {
    console.log('=== рџ“§ РћРўРџР РђР’РљРђ EMAIL (РќРћР’РђРЇ Р’Р•Р РЎРРЇ) ===');
    
    // рџ”§ РРЎРџР РђР’Р›Р•РќРќРђРЇ Р“Р•РќР•Р РђР¦РРЇ EMAIL
    const getFixedEmailForAssignee = (assigneeName: string) => {
      const emailMap: Record<string, string> = {
        'РўРµСЃС‚РѕРІС‹Р№ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ': 'test.user@ethereal.email',
        'РќРѕРІС‹Р№ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ': 'new.user@ethereal.email',
        'РРІР°РЅ РРІР°РЅРѕРІ': 'ivan.ivanov@ethereal.email',
        'РџРµС‚СЂ РџРµС‚СЂРѕРІ': 'petr.petrov@ethereal.email',
        'РњР°СЂРёСЏ РЎРёРґРѕСЂРѕРІР°': 'maria.sidorova@ethereal.email',
        'РђР»РµРєСЃРµР№ РђР»РµРєСЃРµРµРІ': 'alexey.alexeev@ethereal.email',
        'РђРґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂ': 'admin@ethereal.email',
        'Р“Р»Р°РІРЅС‹Р№ РђРґРјРёРЅРёСЃС‚СЂР°С‚РѕСЂ': 'admin@ethereal.email'
      };
      
      // РС‰РµРј С‚РѕС‡РЅРѕРµ СЃРѕРІРїР°РґРµРЅРёРµ
      if (emailMap[assigneeName]) {
        return emailMap[assigneeName];
      }
      
      // РС‰РµРј С‡Р°СЃС‚РёС‡РЅРѕРµ СЃРѕРІРїР°РґРµРЅРёРµ (Р±РµР· СѓС‡РµС‚Р° СЂРµРіРёСЃС‚СЂР°)
      const lowerAssignee = assigneeName.toLowerCase();
      for (const [key, value] of Object.entries(emailMap)) {
        if (key.toLowerCase().includes(lowerAssignee) || 
            lowerAssignee.includes(key.toLowerCase())) {
          return value;
        }
      }
      
      // Fallback: РїСЂРѕСЃС‚РѕР№ email РёР· РёРјРµРЅРё
      return `${assigneeName.toLowerCase()
        .replace(/\s+/g, '.')
        .replace(/[^a-zР°-СЏС‘0-9.]/g, '') // Р Р°Р·СЂРµС€Р°РµРј РєРёСЂРёР»Р»РёС†Сѓ
        .replace(/[Р°-СЏС‘]/g, char => {
          // РџСЂРѕСЃС‚Р°СЏ С‚СЂР°РЅСЃР»РёС‚РµСЂР°С†РёСЏ РґР»СЏ РєРёСЂРёР»Р»РёС†С‹
          const map: Record<string, string> = {
            'Р°': 'a', 'Р±': 'b', 'РІ': 'v', 'Рі': 'g', 'Рґ': 'd', 'Рµ': 'e', 'С‘': 'yo',
            'Р¶': 'zh', 'Р·': 'z', 'Рё': 'i', 'Р№': 'y', 'Рє': 'k', 'Р»': 'l', 'Рј': 'm',
            'РЅ': 'n', 'Рѕ': 'o', 'Рї': 'p', 'СЂ': 'r', 'СЃ': 's', 'С‚': 't', 'Сѓ': 'u',
            'С„': 'f', 'С…': 'h', 'С†': 'ts', 'С‡': 'ch', 'С€': 'sh', 'С‰': 'sch',
            'СЉ': '', 'С‹': 'y', 'СЊ': '', 'СЌ': 'e', 'СЋ': 'yu', 'СЏ': 'ya'
          };
          return map[char] || '';
        })
        .replace(/\.+/g, '.')
        .replace(/^\.|\.$/g, '')}@ethereal.email`;
    };

    // РџРѕР»СѓС‡Р°РµРј email
    const assigneeEmail = getFixedEmailForAssignee(taskData.assignee || 'user');
    console.log(`рџ“§ Email РґР»СЏ '${taskData.assignee}': ${assigneeEmail}`);

    // РџСЂРѕРІРµСЂСЏРµРј РІР°Р»РёРґРЅРѕСЃС‚СЊ email РїРµСЂРµРґ РѕС‚РїСЂР°РІРєРѕР№
    if (!assigneeEmail || !assigneeEmail.includes('@') || assigneeEmail === '.@ethereal.email') {
      console.warn('вљ пёЏ РќРµРєРѕСЂСЂРµРєС‚РЅС‹Р№ email, РїСЂРѕРїСѓСЃРєР°РµРј РѕС‚РїСЂР°РІРєСѓ');
    } else {
      console.log(`рџ“§ РћС‚РїСЂР°РІР»СЏРµРј 'task-created' РЅР°: ${assigneeEmail}`);
      
      // РђСЃРёРЅС…СЂРѕРЅРЅРѕ РѕС‚РїСЂР°РІР»СЏРµРј, РЅРѕ РЅРµ Р¶РґРµРј
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
          console.log('вњ… Email РѕС‚РїСЂР°РІР»РµРЅ СѓСЃРїРµС€РЅРѕ');
          console.log('рџ‘Ђ Preview:', result.previewUrl);
          if (result.previewUrl) {
            window.open(result.previewUrl, '_blank');
          }
        }
      }).catch(err => {
        console.error('вќЊ РћС€РёР±РєР° РїСЂРё РѕС‚РїСЂР°РІРєРµ email:', err);
      });
    } // в†ђ Р—Р°РєСЂС‹РІР°РµРј else Р±Р»РѕРєР° РїСЂРѕРІРµСЂРєРё email
    
  } else { // в†ђ Р­С‚Рѕ else РґР»СЏ РџР•Р Р’РћР“Рћ if (РїСЂРѕРІРµСЂРєР° window Рё EMAIL_ENABLED)
    console.log('рџ“§ Email РѕС‚РїСЂР°РІРєР° РѕС‚РєР»СЋС‡РµРЅР° РёР»Рё СЃРµСЂРІРµСЂРЅС‹Р№ СЂРµРЅРґРµСЂРёРЅРі');
  }

  // 1. Р›РѕРєР°Р»СЊРЅРѕРµ РѕР±РЅРѕРІР»РµРЅРёРµ (РјРіРЅРѕРІРµРЅРЅРѕ)
  setTasks((prev) => [...prev, newTask]);
  addNotification(`Создана новая задача: ${taskData.title}`, "task");

  // 2. API РѕР±РЅРѕРІР»РµРЅРёРµ (Р°СЃРёРЅС…СЂРѕРЅРЅРѕ)
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
    console.log('вњ… Р—Р°РґР°С‡Р° СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅР° СЃ API');
    
    // 3. РџРѕСЃР»Рµ СѓСЃРїРµС€РЅРѕРіРѕ СЃРѕР·РґР°РЅРёСЏ РІ API, РѕР±РЅРѕРІР»СЏРµРј Р»РѕРєР°Р»СЊРЅРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ СЃ РґР°РЅРЅС‹РјРё РёР· API
    setTimeout(async () => {
      try {
        const updatedTasks = await loadTasksFromAPI();
        console.log('вњ… Р›РѕРєР°Р»СЊРЅРѕРµ СЃРѕСЃС‚РѕСЏРЅРёРµ РѕР±РЅРѕРІР»РµРЅРѕ РёР· API');
        
        // РќР°С…РѕРґРёРј РЅР°С€Сѓ РЅРѕРІСѓСЋ Р·Р°РґР°С‡Сѓ РІ РѕР±РЅРѕРІР»РµРЅРЅРѕРј СЃРїРёСЃРєРµ
        const foundTask = updatedTasks.find(task => 
          task.title === newTask.title && 
          task.description === newTask.description
        );
        
        if (foundTask) {
          console.log('вњ… РќРѕРІР°СЏ Р·Р°РґР°С‡Р° РЅР°Р№РґРµРЅР° РІ API:', foundTask.id);
        }
      } catch (error) {
        console.warn('вљ пёЏ РќРµ СѓРґР°Р»РѕСЃСЊ РѕР±РЅРѕРІРёС‚СЊ РёР· API, РЅРѕ Р·Р°РґР°С‡Р° СЃРѕС…СЂР°РЅРµРЅР° Р»РѕРєР°Р»СЊРЅРѕ');
      }
    }, 1000);
    
  } catch (error) {
    console.warn('вљ пёЏ РќРµ СѓРґР°Р»РѕСЃСЊ СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°С‚СЊ Р·Р°РґР°С‡Сѓ СЃ API, СЃРѕС…СЂР°РЅСЏРµРј Р»РѕРєР°Р»СЊРЅРѕ');
  }

  return newTask;
};

  // вњ… РћР±РЅРѕРІР»РµРЅРёРµ Р·Р°РґР°С‡Рё (dual-write)
  const updateTask = async (id: number, updatedFields: Partial<Task>) => {
    const taskToUpdate = tasks.find(t => t.id === id);
    
    if (!taskToUpdate) {
      console.warn('вќЊ Р—Р°РґР°С‡Р° РЅРµ РЅР°Р№РґРµРЅР°:', id);
      return;
    }

    console.log('рџ”„ РћР±РЅРѕРІР»РµРЅРёРµ Р·Р°РґР°С‡Рё:', id, updatedFields);

    // 1. Р›РѕРєР°Р»СЊРЅРѕРµ РѕР±РЅРѕРІР»РµРЅРёРµ (РјРіРЅРѕРІРµРЅРЅРѕ)
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, ...updatedFields, updatedAt: new Date() } : task
      )
    );

    addNotification(`Задача обновлена: ${taskToUpdate.title}`, "task");

    // 2. API РѕР±РЅРѕРІР»РµРЅРёРµ (Р°СЃРёРЅС…СЂРѕРЅРЅРѕ)
    try {
      // РљРѕРЅРІРµСЂС‚РёСЂСѓРµРј СЃС‚Р°С‚СѓСЃ РѕР±СЂР°С‚РЅРѕ РІ API С„РѕСЂРјР°С‚
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
      console.log('вњ… РћР±РЅРѕРІР»РµРЅРёРµ Р·Р°РґР°С‡Рё СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅРѕ СЃ API');
    } catch (error) {
      console.warn('вљ пёЏ РќРµ СѓРґР°Р»РѕСЃСЊ СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°С‚СЊ РѕР±РЅРѕРІР»РµРЅРёРµ СЃ API, СЃРѕС…СЂР°РЅСЏРµРј Р»РѕРєР°Р»СЊРЅРѕ');
    }
  };
  // вњ… РћР±РЅРѕРІР»РµРЅРёРµ Р·Р°РґР°С‡Рё СЃ email СѓРІРµРґРѕРјР»РµРЅРёСЏРјРё
const updateTaskWithNotification = async (
  id: number, 
  updatedFields: Partial<Task>, 
  userId: string
) => {
  const taskToUpdate = tasks.find(t => t.id === id);
  
  if (!taskToUpdate) {
    console.warn('вќЊ Р—Р°РґР°С‡Р° РЅРµ РЅР°Р№РґРµРЅР°:', id);
    return;
  }

  console.log('рџ”„ РћР±РЅРѕРІР»РµРЅРёРµ Р·Р°РґР°С‡Рё СЃ СѓРІРµРґРѕРјР»РµРЅРёРµРј:', id, updatedFields);

  // РџСЂРѕРІРµСЂСЏРµРј РёР·РјРµРЅРµРЅРёСЏ РґР»СЏ email СѓРІРµРґРѕРјР»РµРЅРёСЏ
  const changes = {
    status: updatedFields.status !== taskToUpdate.status ? 
      { old: taskToUpdate.status, new: updatedFields.status } : null,
    priority: updatedFields.priority !== taskToUpdate.priority ? 
      { old: taskToUpdate.priority, new: updatedFields.priority } : null,
    assignee: updatedFields.assignee !== taskToUpdate.assignee ? 
      { old: taskToUpdate.assignee, new: updatedFields.assignee } : null
  };

  // 1. Р›РѕРєР°Р»СЊРЅРѕРµ РѕР±РЅРѕРІР»РµРЅРёРµ (РјРіРЅРѕРІРµРЅРЅРѕ)
  setTasks((prev) =>
    prev.map((task) =>
      task.id === id ? { ...task, ...updatedFields, updatedAt: new Date() } : task
    )
  );

  addNotification(`Задача обновлена: ${taskToUpdate.title}`, "task");

  // 2. РћС‚РїСЂР°РІР»СЏРµРј email РµСЃР»Рё РµСЃС‚СЊ РёР·РјРµРЅРµРЅРёСЏ
  const hasChanges = Object.values(changes).some(change => change !== null);
  
  if (hasChanges && process.env.NEXT_PUBLIC_EMAIL_ENABLED === 'true') {
    // РћРїСЂРµРґРµР»СЏРµРј С‚РёРї email
    let emailType: EmailType = 'task-updated';
    if (updatedFields.status === 'done' && taskToUpdate.status !== 'done') {
      emailType = 'task-completed';
    }

    // РћРїСЂРµРґРµР»СЏРµРј РїРѕР»СѓС‡Р°С‚РµР»СЏ
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

  // 3. API РѕР±РЅРѕРІР»РµРЅРёРµ (Р°СЃРёРЅС…СЂРѕРЅРЅРѕ)
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
    console.log('вњ… РћР±РЅРѕРІР»РµРЅРёРµ Р·Р°РґР°С‡Рё СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅРѕ СЃ API');
  } catch (error) {
    console.warn('вљ пёЏ РќРµ СѓРґР°Р»РѕСЃСЊ СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°С‚СЊ РѕР±РЅРѕРІР»РµРЅРёРµ СЃ API, СЃРѕС…СЂР°РЅСЏРµРј Р»РѕРєР°Р»СЊРЅРѕ');
  }
};

  // вњ… РЈРґР°Р»РµРЅРёРµ Р·Р°РґР°С‡Рё (dual-write)
  const deleteTask = async (id: number) => {
    const deletedTask = tasks.find((t) => t.id === id);
    
    console.log('рџ”„ РЈРґР°Р»РµРЅРёРµ Р·Р°РґР°С‡Рё:', id);

    // 1. Р›РѕРєР°Р»СЊРЅРѕРµ СѓРґР°Р»РµРЅРёРµ (РјРіРЅРѕРІРµРЅРЅРѕ)
    setTasks((prev) => prev.filter((task) => task.id !== id));

    if (deletedTask) {
      addNotification(`Задача удалена: ${deletedTask.title}`, "task");
    }

    // 2. API СѓРґР°Р»РµРЅРёРµ (Р°СЃРёРЅС…СЂРѕРЅРЅРѕ)
    try {
      await apiRequest(`/tasks/task-${id}`, {
        method: 'DELETE'
      });
      console.log('вњ… РЈРґР°Р»РµРЅРёРµ Р·Р°РґР°С‡Рё СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅРѕ СЃ API');
    } catch (error) {
      console.warn('вљ пёЏ РќРµ СѓРґР°Р»РѕСЃСЊ СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°С‚СЊ СѓРґР°Р»РµРЅРёРµ СЃ API, СѓРґР°Р»СЏРµРј Р»РѕРєР°Р»СЊРЅРѕ');
    }
  };

  // вњ… РџРµСЂРµРјРµС‰РµРЅРёРµ Р·Р°РґР°С‡Рё (dual-write)
  const moveTask = async (id: number, newStatus: Task["status"]) => {
    const movedTask = tasks.find((t) => t.id === id);
    
    console.log('рџ”„ РџРµСЂРµРјРµС‰РµРЅРёРµ Р·Р°РґР°С‡Рё:', id, newStatus);

    // 1. Р›РѕРєР°Р»СЊРЅРѕРµ РѕР±РЅРѕРІР»РµРЅРёРµ (РјРіРЅРѕРІРµРЅРЅРѕ)
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, status: newStatus, updatedAt: new Date() } : task
      )
    );

    if (movedTask) {
      addNotification(`Задача перемещена: ${movedTask.title}`, "task");
    }

    // 2. API РѕР±РЅРѕРІР»РµРЅРёРµ (Р°СЃРёРЅС…СЂРѕРЅРЅРѕ)
    try {
      // РљРѕРЅРІРµСЂС‚РёСЂСѓРµРј СЃС‚Р°С‚СѓСЃ РѕР±СЂР°С‚РЅРѕ РІ API С„РѕСЂРјР°С‚
      const apiStatus = newStatus === 'inprogress' ? 'in-progress' : newStatus;

      await apiRequest(`/tasks/task-${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: apiStatus
        })
      });
      console.log('вњ… РџРµСЂРµРјРµС‰РµРЅРёРµ Р·Р°РґР°С‡Рё СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅРѕ СЃ API');
    } catch (error) {
      console.warn('вљ пёЏ РќРµ СѓРґР°Р»РѕСЃСЊ СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°С‚СЊ РїРµСЂРµРјРµС‰РµРЅРёРµ СЃ API, СЃРѕС…СЂР°РЅСЏРµРј Р»РѕРєР°Р»СЊРЅРѕ');
    }
  };

  // вњ… РЎС‚Р°С‚РёСЃС‚РёРєР°
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

  // вњ… Р¤РёР»СЊС‚СЂР°С†РёСЏ Р·Р°РґР°С‡
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

  // вњ… Р—Р°РґР°С‡Рё РєРѕРЅРєСЂРµС‚РЅРѕРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
  const getUserTasks = (userId: string, userName?: string, userEmail?: string) => {
    const normalize = (value?: string | null) => (value || '').trim().toLowerCase();
    const normalizedId = normalize(userId);
    const normalizedName = normalize(userName);
    const normalizedEmail = normalize(userEmail);

    return tasks.filter((task) => {
      const assignee = normalize(task.assignee);

      if (task.createdBy === userId) return true;
      if (assignee && assignee === normalizedId) return true;
      if (assignee && normalizedName && assignee === normalizedName) return true;
      if (assignee && normalizedEmail && assignee === normalizedEmail) return true;

      return false;
    });
  };

  // вњ… РЎС‚Р°С‚РёСЃС‚РёРєР° РєРѕРЅРєСЂРµС‚РЅРѕРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ
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

  // вњ… РћС‡РёСЃС‚РєР° РІСЃРµС… Р·Р°РґР°С‡
  const clearAllTasks = () => {
    setTasks([]);
    addNotification('Все задачи были очищены', 'system');
  };

  // вњ… Р’РѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёРµ РґРµРјРѕ-РґР°РЅРЅС‹С…
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

  // вњ… Р­РєСЃРїРѕСЂС‚ Р·Р°РґР°С‡
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

  // вњ… Р’СЃРїРѕРјРѕРіР°С‚РµР»СЊРЅР°СЏ С„СѓРЅРєС†РёСЏ РґР»СЏ РїСЂРѕРІРµСЂРєРё РґРµРґР»Р°Р№РЅР°
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
  updateTaskWithNotification, // в†ђ Р”РћР‘РђР’Р¬РўР• Р­РўРћ
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
  checkDeadlines // в†ђ Р”РћР‘РђР’Р¬РўР• Р­РўРћ (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ, РґР»СЏ С‚РµСЃС‚РѕРІ)
};

}
