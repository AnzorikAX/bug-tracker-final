"use client";

import { useState } from 'react';

export default function DebugApi() {
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testApiConnection = async () => {
    addLog('🔍 Тестируем подключение к API...');
    
    try {
      const response = await fetch('/api/tasks');
      const result = await response.json();
      
      if (result.success) {
        addLog(`✅ API работает! Задач в API: ${result.data.length}`);
        addLog(`📋 Первые 2 задачи: ${JSON.stringify(result.data.slice(0, 2).map((t: any) => ({id: t.id, title: t.title})))}`);
      } else {
        addLog(`❌ API вернул ошибку: ${result.error}`);
      }
    } catch (error: any) {
      addLog(`❌ Ошибка подключения к API: ${error.message}`);
    }
  };

  const testCreateTask = async () => {
    addLog('🚀 Тестируем создание задачи...');
    
    const testTask = {
      title: 'Тестовая задача из дебага ' + Date.now(),
      description: 'Это тест создания задачи через API',
      priority: 'medium' as const,
      assignee: 'user-1'
    };

    addLog(`📨 Отправляем данные: ${JSON.stringify(testTask)}`);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testTask)
      });
      
      const result = await response.json();
      
      if (result.success) {
        addLog(`✅ Задача создана! ID: ${result.data.id}`);
        addLog(`📨 Ответ API: ${JSON.stringify(result)}`);
        
        // Проверяем, появилась ли задача в списке
        setTimeout(() => {
          checkTasksAfterCreate();
        }, 1000);
      } else {
        addLog(`❌ Ошибка создания: ${result.error}`);
      }
    } catch (error: any) {
      addLog(`❌ Ошибка при создании: ${error.message}`);
    }
  };

  const checkTasksAfterCreate = async () => {
    addLog('🔍 Проверяем обновленный список задач...');
    
    try {
      const response = await fetch('/api/tasks');
      const result = await response.json();
      
      if (result.success) {
        addLog(`📊 Теперь задач в API: ${result.data.length}`);
        const lastTask = result.data[result.data.length - 1];
        addLog(`📝 Последняя задача: "${lastTask.title}" (ID: ${lastTask.id})`);
      }
    } catch (error: any) {
      addLog(`❌ Ошибка при проверке: ${error.message}`);
    }
  };

  const testLocalStorage = () => {
    addLog('💾 Проверяем localStorage...');
    
    try {
      const saved = localStorage.getItem('bug-tracker-tasks');
      if (saved) {
        const tasks = JSON.parse(saved);
        addLog(`📁 Локальных задач: ${tasks.length}`);
        addLog(`📝 Локальные задачи: ${JSON.stringify(tasks.slice(0, 2).map((t: any) => ({id: t.id, title: t.title})))}`);
      } else {
        addLog('📁 localStorage пуст');
      }
    } catch (error: any) {
      addLog(`❌ Ошибка localStorage: ${error.message}`);
    }
  };

  const clearLog = () => {
    setLog([]);
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('bug-tracker-tasks');
    addLog('🗑️ localStorage очищен');
  };

  return (
    <div className="p-4 bg-gray-100 border-b border-gray-300">
      <h3 className="text-lg font-bold mb-2 flex items-center">
        <span className="mr-2">🐛</span>
        Debug API
      </h3>
      
      <div className="flex gap-2 mb-4 flex-wrap">
        <button 
          onClick={testApiConnection}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
        >
          Тест API
        </button>
        <button 
          onClick={testCreateTask}
          className="bg-green-500 text-white px-3 py-1 rounded text-sm"
        >
          Создать задачу
        </button>
        <button 
          onClick={testLocalStorage}
          className="bg-purple-500 text-white px-3 py-1 rounded text-sm"
        >
          Проверить localStorage
        </button>
        <button 
          onClick={clearLocalStorage}
          className="bg-yellow-500 text-white px-3 py-1 rounded text-sm"
        >
          Очистить localStorage
        </button>
        <button 
          onClick={clearLog}
          className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
        >
          Очистить лог
        </button>
      </div>

      <div className="bg-black text-green-400 p-3 rounded font-mono text-sm max-h-40 overflow-y-auto">
        {log.length === 0 ? (
          <div className="text-gray-500">Лог пуст. Нажмите кнопки для тестирования...</div>
        ) : (
          log.map((entry, index) => (
            <div key={index} className="whitespace-pre-wrap">{entry}</div>
          ))
        )}
      </div>
    </div>
  );
}