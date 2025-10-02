'use client';

import { useState, useEffect } from 'react';
import { Task } from '../hooks/useTasks';

type TaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreate: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => void;
  currentUser: { id: number; name: string };
};

export default function TaskModal({ isOpen, onClose, onTaskCreate, currentUser }: TaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assignee: '',
    status: 'todo' as 'todo' | 'inprogress' | 'done'
  });

  // Сброс формы при открытии/закрытии модального окна
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        assignee: '',
        status: 'todo'
      });
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Пожалуйста, введите название задачи');
      return;
    }

    // Задача будет создана с привязкой к текущему пользователю
    onTaskCreate(formData);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Создать новую задачу</h2>
            <p className="text-sm text-gray-600 mt-1">
              Создатель: {currentUser.name}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Название задачи */}
          <div>
            <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 mb-1">
              Название задачи *
            </label>
            <input
              type="text"
              id="task-title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Введите название задачи..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Описание */}
          <div>
            <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              id="task-description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Опишите задачу подробнее..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Приоритет и статус в одной строке */}
          <div className="grid grid-cols-2 gap-4">
            {/* Приоритет */}
            <div>
              <label htmlFor="task-priority" className="block text-sm font-medium text-gray-700 mb-1">
                Приоритет
              </label>
              <select
                id="task-priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">🟢 Низкий</option>
                <option value="medium">🟡 Средний</option>
                <option value="high">🔴 Высокий</option>
              </select>
            </div>

            {/* Статус */}
            <div>
              <label htmlFor="task-status" className="block text-sm font-medium text-gray-700 mb-1">
                Статус
              </label>
              <select
                id="task-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todo">📋 К выполнению</option>
                <option value="inprogress">🚀 В работе</option>
                <option value="done">✅ Выполнено</option>
              </select>
            </div>
          </div>

          {/* Исполнитель */}
          <div>
            <label htmlFor="task-assignee" className="block text-sm font-medium text-gray-700 mb-1">
              Исполнитель
            </label>
            <input
              type="text"
              id="task-assignee"
              name="assignee"
              value={formData.assignee}
              onChange={handleChange}
              placeholder="Введите имя исполнителя..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              list="assignee-suggestions"
            />
            <datalist id="assignee-suggestions">
              <option value="Иван Иванов" />
              <option value="Петр Петров" />
              <option value="Мария Сидорова" />
              <option value="Алексей Алексеев" />
              <option value="Елена Еленова" />
              <option value="Не назначен" />
            </datalist>
          </div>

          {/* Кнопки */}
          <div className="flex justify-end space-x-3 pt-4 sticky bottom-0 bg-white pb-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Создать задачу
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}