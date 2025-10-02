'use client';

import { useState, useMemo } from 'react';
import TaskModal from './TaskModal';
import EditTaskModal from './EditTaskModal';
import SearchBar from './SearchBar';
import { useTasks, type Task } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications'; // 🔹 добавлено

type StatusType = 'todo' | 'inprogress' | 'done';

type Status = {
  id: StatusType;
  title: string;
  color: string;
};

export default function TaskBoard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // Состояния поиска и фильтров
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    priority: 'all',
    status: 'all',
    assignee: 'all',
  });

  const [taskFilter, setTaskFilter] = useState<'all' | 'my'>('all');

  const {
    tasks,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    getStats,
    getFilteredTasks,
    getUserTasks,
    getUserStats,
  } = useTasks();

  const { user } = useAuth();
  const { addNotification } = useNotifications(); // 🔹 уведомления

  // Базовые задачи (все или только мои)
  const baseTasks = useMemo(() => {
    if (taskFilter === 'my' && user) {
      return getUserTasks(user.id);
    }
    return tasks;
  }, [tasks, taskFilter, user, getUserTasks]);

  // Применяем поиск и фильтры
  const filteredTasks = useMemo(() => {
    return getFilteredTasks(
      {
        query: searchQuery,
        ...filters,
      },
      baseTasks
    );
  }, [baseTasks, searchQuery, filters, getFilteredTasks]);

  const statuses: Status[] = [
    { id: 'todo', title: '📋 К выполнению', color: 'bg-gray-100' },
    { id: 'inprogress', title: '🚀 В работе', color: 'bg-blue-100' },
    { id: 'done', title: '✅ Выполнено', color: 'bg-green-100' },
  ];

  // --- Обработчики с уведомлениями ---
  const handleTaskCreate = (
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ) => {
    if (user) {
      createTask(taskData, user.id);
      addNotification('task_created', {
        title: 'Задача создана',
        message: `Новая задача "${taskData.title}" успешно добавлена.`,
      });
    }
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    updateTask(updatedTask.id, updatedTask);
    addNotification('task_updated', {
      title: 'Задача обновлена',
      message: `Задача "${updatedTask.title}" обновлена.`,
    });
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleDeleteTask = (taskId: number) => {
    if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
      deleteTask(taskId);
      addNotification('task_deleted', {
        title: 'Задача удалена',
        message: `Задача #${taskId} была удалена.`,
      });
    }
  };

  const handleSearch = (query: string) => setSearchQuery(query);
  const handleFilterChange = (newFilters: any) => setFilters(newFilters);

  const handleTaskFilterChange = (filter: 'all' | 'my') => {
    setTaskFilter(filter);
    setSearchQuery('');
    setFilters({
      priority: 'all',
      status: 'all',
      assignee: 'all',
    });
  };

  // Drag & Drop
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: StatusType) => {
    e.preventDefault();
    if (draggedTask) {
      moveTask(draggedTask.id, status);
      addNotification('task_updated', {
        title: 'Статус изменён',
        message: `Задача "${draggedTask.title}" перемещена в ${status}.`,
      });
      setDraggedTask(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-green-500 bg-green-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const stats = getStats();
  const userStats = user ? getUserStats(user.id) : null;
  const filteredStats = {
    total: filteredTasks.length,
    todo: filteredTasks.filter((t) => t.status === 'todo').length,
    inprogress: filteredTasks.filter((t) => t.status === 'inprogress').length,
    done: filteredTasks.filter((t) => t.status === 'done').length,
  };

  return (
    <div className="p-6">
      {/* Модалки */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskCreate={handleTaskCreate}
        currentUser={user || { id: 0, name: 'Пользователь' }}
      />

      <EditTaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onTaskUpdate={handleTaskUpdate}
        task={editingTask}
      />

      {/* Поиск и фильтры */}
      <SearchBar onSearch={handleSearch} onFilterChange={handleFilterChange} />

      {/* Заголовок */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {taskFilter === 'my' ? 'Мои задачи' : 'Доска задач'}
          </h2>
          <p className="text-sm text-gray-600">
            {user?.name && `Добро пожаловать, ${user.name}! `}
            {filteredTasks.length === baseTasks.length
              ? `Всего задач: ${baseTasks.length}`
              : `Найдено: ${filteredTasks.length} из ${baseTasks.length}`}
            {userStats && taskFilter === 'my' && ` (${userStats.done}/${userStats.total} выполнено)`}
            {user?.role === 'admin' && ' (Администратор)'}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Переключатель */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleTaskFilterChange('all')}
              className={`px-4 py-2 rounded-md transition-colors ${
                taskFilter === 'all'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Все задачи
            </button>
            <button
              onClick={() => handleTaskFilterChange('my')}
              className={`px-4 py-2 rounded-md transition-colors ${
                taskFilter === 'my'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Мои задачи
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            + Новая задача
          </button>
        </div>
      </div>

      {/* Доска */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statuses.map((status) => (
          <div
            key={status.id}
            className={`rounded-lg p-4 ${status.color} min-h-[400px]`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status.id)}
          >
            <h3 className="font-semibold text-lg mb-4">
              {status.title}
              <span className="ml-2 bg-white px-2 py-1 rounded-full text-sm">
                {filteredTasks.filter((t) => t.status === status.id).length}
              </span>
            </h3>

            <div className="space-y-3">
              {filteredTasks
                .filter((t) => t.status === status.id)
                .map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${getPriorityColor(
                      task.priority
                    )} cursor-move hover:shadow-md transition-shadow`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-800">{task.title}</h4>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          task.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : task.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {task.priority === 'high'
                          ? 'Высокий'
                          : task.priority === 'medium'
                          ? 'Средний'
                          : 'Низкий'}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{task.description}</p>

                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <div>
                        <span>👤 {task.assignee}</span>
                        {task.createdBy === user?.id && (
                          <span className="ml-2 bg-blue-100 text-blue-800 px-1 rounded">
                            моя
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(task)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              {filteredTasks.filter((t) => t.status === status.id).length === 0 && (
                <div className="text-center text-gray-400 py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  {searchQuery ||
                  filters.priority !== 'all' ||
                  filters.status !== 'all' ||
                  filters.assignee !== 'all'
                    ? 'Задачи не найдены'
                    : 'Перетащите задачи сюда'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Статистика */}
      <div className="mt-8 grid grid-cols-4 gap-4 text-center">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-gray-800">{filteredStats.total}</div>
          <div className="text-sm text-gray-600">
            {filteredStats.total === baseTasks.length ? 'Всего задач' : 'Найдено'}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-orange-600">{filteredStats.todo}</div>
          <div className="text-sm text-gray-600">К выполнению</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{filteredStats.inprogress}</div>
          <div className="text-sm text-gray-600">В работе</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-2xl font-bold text-green-600">{filteredStats.done}</div>
          <div className="text-sm text-gray-600">Выполнено</div>
        </div>
      </div>

      {/* Подсказка */}
      <div className="mt-4 text-center text-sm text-gray-500">
        💡 Используйте поиск и фильтры для быстрого нахождения задач
        {taskFilter === 'my' && ' • Показаны только задачи, созданные вами'}
      </div>
    </div>
  );
}
