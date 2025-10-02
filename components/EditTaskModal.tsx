'use client';

import { useState, useEffect } from 'react';
import { Task } from '../hooks/useTasks';

type EditTaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdate: (task: Task) => void;
  task: Task | null;
};

export default function EditTaskModal({ isOpen, onClose, onTaskUpdate, task }: EditTaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assignee: '',
    status: 'todo' as 'todo' | 'inprogress' | 'done'
  });

  const [errors, setErrors] = useState({
    title: ''
  });

  // Заполняем форму данными задачи при открытии
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        assignee: task.assignee,
        status: task.status
      });
      setErrors({ title: '' });
    }
  }, [task, isOpen]);

  const validateForm = () => {
    const newErrors = { title: '' };
    
    if (!formData.title.trim()) {
      newErrors.title = 'Название задачи обязательно';
    }
    
    setErrors(newErrors);
    return !newErrors.title;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !task) return;

    const updatedTask: Task = {
      ...task,
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      assignee: formData.assignee,
      status: formData.status,
      updatedAt: new Date().toISOString()
    };

    onTaskUpdate(updatedTask);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Очищаем ошибку при изменении поля
    if (name === 'title' && errors.title) {
      setErrors(prev => ({ ...prev, title: '' }));
    }
  };

  const handlePriorityChange = (priority: 'low' | 'medium' | 'high') => {
    setFormData(prev => ({ ...prev, priority }));
  };

  const handleStatusChange = (status: 'todo' | 'inprogress' | 'done') => {
    setFormData(prev => ({ ...prev, status }));
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Заголовок */}
        <div className="flex justify-between items-center p-6 border-b bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Редактировать задачу</h2>
            <p className="text-sm text-gray-600 mt-1">ID: #{task.id}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Название задачи */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Название задачи *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Введите название задачи..."
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Описание */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Описание задачи
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Опишите задачу подробнее..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
            />
            <p className="text-gray-500 text-sm mt-1">
              {formData.description.length}/500 символов
            </p>
          </div>

          {/* Приоритет */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Приоритет задачи
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handlePriorityChange('low')}
                className={`p-3 border rounded-lg text-center transition-all ${
                  formData.priority === 'low'
                    ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
                }`}
              >
                <div className="text-lg">🟢</div>
                <div className="font-medium">Низкий</div>
                <div className="text-xs text-gray-500 mt-1">Не срочно</div>
              </button>
              
              <button
                type="button"
                onClick={() => handlePriorityChange('medium')}
                className={`p-3 border rounded-lg text-center transition-all ${
                  formData.priority === 'medium'
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700 shadow-sm'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-yellow-300'
                }`}
              >
                <div className="text-lg">🟡</div>
                <div className="font-medium">Средний</div>
                <div className="text-xs text-gray-500 mt-1">Обычный</div>
              </button>
              
              <button
                type="button"
                onClick={() => handlePriorityChange('high')}
                className={`p-3 border rounded-lg text-center transition-all ${
                  formData.priority === 'high'
                    ? 'border-red-500 bg-red-50 text-red-700 shadow-sm'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-red-300'
                }`}
              >
                <div className="text-lg">🔴</div>
                <div className="font-medium">Высокий</div>
                <div className="text-xs text-gray-500 mt-1">Срочно</div>
              </button>
            </div>
          </div>

          {/* Статус и исполнитель в одной строке */}
          <div className="grid grid-cols-2 gap-6">
            {/* Статус */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Статус выполнения
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange('todo')}
                  className={`w-full text-left p-3 border rounded-lg transition-all ${
                    formData.status === 'todo'
                      ? 'border-gray-500 bg-gray-50 text-gray-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-2">📋</span>
                    <span>К выполнению</span>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleStatusChange('inprogress')}
                  className={`w-full text-left p-3 border rounded-lg transition-all ${
                    formData.status === 'inprogress'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-2">🚀</span>
                    <span>В работе</span>
                  </div>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleStatusChange('done')}
                  className={`w-full text-left p-3 border rounded-lg transition-all ${
                    formData.status === 'done'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-2">✅</span>
                    <span>Выполнено</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Исполнитель */}
            <div>
              <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-2">
                Исполнитель
              </label>
              <input
                type="text"
                id="assignee"
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
              </datalist>
              <p className="text-gray-500 text-sm mt-1">
                Начните вводить для подсказок
              </p>
            </div>
          </div>

          {/* Мета-информация */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-2">Информация о задаче</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Создана:</span>
                <span className="ml-2 text-gray-800">
                  {task.createdAt ? new Date(task.createdAt).toLocaleDateString('ru-RU') : 'Неизвестно'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Обновлена:</span>
                <span className="ml-2 text-gray-800">
                  {task.updatedAt ? new Date(task.updatedAt).toLocaleDateString('ru-RU') : 'Неизвестно'}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Кнопки действий */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50 sticky bottom-0">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => {
                if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
                  // Здесь можно добавить обработчик удаления
                  onClose();
                }
              }}
              className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              Удалить задачу
            </button>
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={!formData.title.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Сохранить изменения
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}