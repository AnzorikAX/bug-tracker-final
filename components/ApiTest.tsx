"use client";

import { useState, useEffect } from 'react';

export default function ApiTest() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch('/api/tasks');
      const result = await response.json();
      if (result.success) {
        setTasks(result.data);
        setMessage(`✅ Успешно загружено ${result.data.length} задач`);
      } else {
        setMessage('❌ Ошибка при загрузке задач');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setMessage('❌ Ошибка сети при загрузке задач');
    } finally {
      setLoading(false);
    }
  };

  const createTestTask = async () => {
    setMessage('');
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Новая тестовая задача из API',
          description: 'Это задача создана через API интеграцию',
          priority: 'medium',
          assignee: 'user-1'
        })
      });
      const result = await response.json();
      if (result.success) {
        setMessage(`✅ Задача создана с ID: ${result.data.id}`);
        fetchTasks(); // Обновляем список
      } else {
        setMessage('❌ Ошибка при создании задачи');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      setMessage('❌ Ошибка сети при создании задачи');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="p-6 bg-yellow-50 border-b border-yellow-200">
      <h3 className="text-lg font-bold mb-4 flex items-center">
        <span className="mr-2">🔧</span>
        Тестирование API интеграции
      </h3>
      
      <div className="flex gap-4 mb-4 flex-wrap">
        <button 
          onClick={fetchTasks}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
          disabled={loading}
        >
          <span>🔄</span>
          <span>{loading ? 'Загрузка...' : 'Обновить задачи'}</span>
        </button>
        
        <button 
          onClick={createTestTask}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center space-x-2"
        >
          <span>➕</span>
          <span>Создать тестовую задачу</span>
        </button>

        <button 
          onClick={() => window.open('/api/tasks', '_blank')}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 flex items-center space-x-2"
        >
          <span>👁️</span>
          <span>Открыть API в новой вкладке</span>
        </button>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-white rounded border">
          <span className="font-medium">{message}</span>
        </div>
      )}

      <div className="grid gap-3">
        <h4 className="font-semibold text-gray-700">Задачи из API ({tasks.length}):</h4>
        {tasks.map((task) => (
          <div key={task.id} className="p-3 border rounded bg-white shadow-sm">
            <div className="font-semibold text-gray-800">{task.title}</div>
            <div className="text-sm text-gray-600 mt-1">{task.description}</div>
            <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-2">
              <span className="bg-gray-100 px-2 py-1 rounded">ID: {task.id}</span>
              <span className={`px-2 py-1 rounded ${
                task.status === 'todo' ? 'bg-yellow-100 text-yellow-800' :
                task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                Статус: {task.status}
              </span>
              <span className={`px-2 py-1 rounded ${
                task.priority === 'high' ? 'bg-red-100 text-red-800' :
                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                Приоритет: {task.priority}
              </span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                Исполнитель: {task.assigneeName || task.assignee}
              </span>
            </div>
          </div>
        ))}
        
        {tasks.length === 0 && !loading && (
          <div className="text-center text-gray-500 py-4 bg-white rounded border">
            Нет задач для отображения
          </div>
        )}
      </div>
    </div>
  );
}