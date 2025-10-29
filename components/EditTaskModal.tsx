'use client';

import { useState, useEffect } from 'react';
import { Task } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth'; // ← ДОБАВЛЕНО: Импорт хука для получения пользователей

type EditTaskModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdate: (task: Task) => void;
  task: Task | null;
};

export default function EditTaskModal({ isOpen, onClose, onTaskUpdate, task }: EditTaskModalProps) {
  const { getAllUsers } = useAuth(); // ← ДОБАВЛЕНО: Получаем метод для получения пользователей
  const [users, setUsers] = useState<any[]>([]); // ← ДОБАВЛЕНО: Состояние для списка пользователей
  
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

  // Эффект для загрузки пользователей и заполнения формы ← ОБНОВЛЕНО
  useEffect(() => {
    if (isOpen) {
      const allUsers = getAllUsers();
      setUsers(allUsers);
      
      if (task) {
        setFormData({
          title: task.title,
          description: task.description || '',
          priority: task.priority,
          assignee: task.assignee,
          status: task.status,
          deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : ''
        });
        setErrors({ title: '', deadline: '' });
      }
    }
  }, [task, isOpen, getAllUsers]);

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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !task) return;

    // Создаем обновленную задачу
    const updatedTask: Task = {
      ...task,
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      assignee: formData.assignee,
      status: formData.status,
      deadline: formData.deadline ? new Date(formData.deadline) : null,
      updatedAt: new Date()
    };

    onTaskUpdate(updatedTask);
    onClose();
  };

  // Обработчик изменения полей формы
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Очищаем ошибки при изменении поля
    if (name === 'title' && errors.title) {
      setErrors(prev => ({ ...prev, title: '' }));
    }
    if (name === 'deadline' && errors.deadline) {
      setErrors(prev => ({ ...prev, deadline: '' }));
    }
  };

  // Обработчики изменения приоритета и статуса через кнопки
  const handlePriorityChange = (priority: 'low' | 'medium' | 'high') => {
    setFormData(prev => ({ ...prev, priority }));
  };

  const handleStatusChange = (status: 'todo' | 'inprogress' | 'done') => {
    setFormData(prev => ({ ...prev, status }));
  };

  // Получаем минимальную дату для дедлайна (сегодня)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Форматирование даты для отображения
  const formatDate = (date: Date | null) => {
    if (!date) return 'Не установлен';
    return new Date(date).toLocaleDateString('ru-RU');
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Заголовок модального окна */}
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

        {/* Форма редактирования задачи */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Поле для названия задачи */}
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

          {/* Поле для описания задачи */}
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

          {/* Строка с приоритетом и дедлайном */}
          <div className="grid grid-cols-2 gap-6">
            {/* Блок выбора приоритета */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Приоритет задачи
              </label>
              <div className="grid grid-cols-3 gap-3">
                {/* Кнопка низкого приоритета */}
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
                
                {/* Кнопка среднего приоритета */}
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
                
                {/* Кнопка высокого приоритета */}
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

            {/* Блок для дедлайна */}
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                Дедлайн
              </label>
              <input
                type="date"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                min={getMinDate()}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.deadline ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.deadline && (
                <p className="text-red-600 text-sm mt-1">{errors.deadline}</p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                Текущий дедлайн: <span className="font-medium">{formatDate(task.deadline)}</span>
              </p>
            </div>
          </div>

          {/* Строка со статусом и исполнителем */}
          <div className="grid grid-cols-2 gap-6">
            {/* Блок выбора статуса */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Статус выполнения
              </label>
              <div className="space-y-2">
                {/* Кнопка статуса "К выполнению" */}
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
                
                {/* Кнопка статуса "В работе" */}
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
                
                {/* Кнопка статуса "Выполнено" */}
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

            {/* Блок выбора исполнителя ← ОБНОВЛЕНО */}
            <div>
              <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-2">
                Исполнитель
              </label>
              <select
                id="assignee"
                name="assignee"
                value={formData.assignee}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Не назначен</option>
                {/* Динамически генерируем опции из списка пользователей */}
                {users.map((user) => (
                  <option key={user.id} value={user.name}>
  {user.name} {user.role === 'admin' ? '👑' : ''}
</option>
                ))}
              </select>
              <p className="text-gray-500 text-sm mt-1">
                Выберите пользователя из списка
              </p>
            </div>
          </div>

          {/* Блок с мета-информацией о задаче */}
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
              <div>
                <span className="text-gray-600">Текущий дедлайн:</span>
                <span className="ml-2 text-gray-800 font-medium">
                  {formatDate(task.deadline)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Статус дедлайна:</span>
                <span className="ml-2 text-gray-800">
                  {!task.deadline ? 'Не установлен' : 
                   new Date(task.deadline) < new Date() && task.status !== 'done' ? '⚠️ Просрочен' : 
                   '✅ В норме'}
                </span>
              </div>
            </div>
          </div>
        </form>

        {/* Блок с кнопками действий */}
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