'use client';

import { useState, useEffect } from 'react';
import { Task } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './ToastProvider';

type TaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreate: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => void;
  currentUser: { id: string; name: string }; // ← ИЗМЕНИТЬ: id: string вместо number
};

export default function TaskModal({ isOpen, onClose, onTaskCreate, currentUser }: TaskModalProps) {
  const { getAllUsers } = useAuth();
  const { addToast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assignee: '',
    status: 'todo' as 'todo' | 'inprogress' | 'done',
    deadline: ''
  });

  const [errors, setErrors] = useState({
    title: '',
    deadline: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔄 Эффект для загрузки пользователей при открытии модального окна (АСИНХРОННЫЙ)
  useEffect(() => {
    if (isOpen) {
      loadUsers();
      
      // Сбрасываем форму
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        assignee: '',
        status: 'todo',
        deadline: ''
      });
      setErrors({ title: '', deadline: '' });
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // 🔄 Асинхронная загрузка пользователей
  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      console.log('🔄 Loading users...');
      const allUsers = await getAllUsers();
      console.log('✅ Users loaded:', allUsers);
      setUsers(allUsers);
    } catch (error) {
      console.error('❌ Failed to load users:', error);
      addToast('Не удалось загрузить список пользователей', 'error');
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Функция валидации формы
  const validateForm = () => {
    const newErrors = { title: '', deadline: '' };
    let isValid = true;
    
    if (!formData.title.trim()) {
      newErrors.title = 'Название задачи обязательно';
      isValid = false;
    }
    
    // Валидация дедлайна
    if (formData.deadline) {
      const selectedDate = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.deadline = 'Нельзя установить прошедшую дату';
        isValid = false;
      }
    }
    
    setErrors(newErrors);
    return isValid;
  };

  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      addToast('Пожалуйста, исправьте ошибки в форме', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Подготовка данных с дедлайном
      const taskData = {
        ...formData,
        deadline: formData.deadline ? new Date(formData.deadline) : null
      };

      await onTaskCreate(taskData);
      onClose();
    } catch (error) {
      addToast('Произошла ошибка при создании задачи', 'error');
      console.error('Error creating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Обработчик изменения полей формы
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Очищаем ошибки при изменении поля
    if (errors.title && name === 'title') {
      setErrors(prev => ({ ...prev, title: '' }));
    }
    if (errors.deadline && name === 'deadline') {
      setErrors(prev => ({ ...prev, deadline: '' }));
    }
  };

  // Получаем минимальную дату для дедлайна (сегодня)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Заголовок модального окна */}
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
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        {/* Форма создания задачи */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Поле для названия задачи */}
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
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              required
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Поле для описания задачи */}
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
              disabled={isSubmitting}
            />
          </div>

          {/* Строка с приоритетом, статусом и дедлайном */}
          <div className="grid grid-cols-3 gap-4">
            {/* Выбор приоритета */}
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
                disabled={isSubmitting}
              >
                <option value="low">🟢 Низкий</option>
                <option value="medium">🟡 Средний</option>
                <option value="high">🔴 Высокий</option>
              </select>
            </div>

            {/* Выбор статуса */}
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
                disabled={isSubmitting}
              >
                <option value="todo">📋 К выполнению</option>
                <option value="inprogress">🚀 В работе</option>
                <option value="done">✅ Выполнено</option>
              </select>
            </div>

            {/* Поле для дедлайна */}
            <div>
              <label htmlFor="task-deadline" className="block text-sm font-medium text-gray-700 mb-1">
                Дедлайн
              </label>
              <input
                type="date"
                id="task-deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                min={getMinDate()}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.deadline ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.deadline && (
                <p className="text-red-600 text-sm mt-1">{errors.deadline}</p>
              )}
            </div>
          </div>

          {/* Выбор исполнителя из списка пользователей */}
          <div>
            <label htmlFor="task-assignee" className="block text-sm font-medium text-gray-700 mb-1">
              Исполнитель
            </label>
            <select
              id="task-assignee"
              name="assignee"
              value={formData.assignee}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting || isLoadingUsers}
            >
              <option value="">Не назначен</option>
              {isLoadingUsers ? (
                <option value="" disabled>Загрузка пользователей...</option>
              ) : (
                users.map((user) => (
                  <option key={user.id} value={user.name}>
                    {user.name} {user.role === 'admin' ? '👑' : ''}
                  </option>
                ))
              )}
            </select>
            <p className="text-gray-500 text-sm mt-1">
              {isLoadingUsers ? 'Загрузка списка пользователей...' : 'Выберите пользователя из списка'}
            </p>
          </div>

          {/* Кнопки действий в форме */}
          <div className="flex justify-end space-x-3 pt-4 sticky bottom-0 bg-white pb-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              disabled={isSubmitting || isLoadingUsers}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Создание...</span>
                </>
              ) : (
                <span>Создать задачу</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}