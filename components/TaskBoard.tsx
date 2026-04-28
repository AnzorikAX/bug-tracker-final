'use client';

import { useEffect, useMemo, useState } from 'react';
import TaskModal from './TaskModal';
import EditTaskModal from './EditTaskModal';
import SearchBar from './SearchBar';
import { useTasks, type Task } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { useToast } from './ToastProvider';

type StatusType = 'todo' | 'inprogress' | 'done';

type BoardStatus = {
  id: StatusType;
  title: string;
  icon: string;
  color: string;
};

type ChatMessage = {
  id: string;
  taskId: number;
  author: string;
  body: string;
  kind: 'user' | 'system';
  createdAt: string;
};

type ApiMessage = {
  id: number;
  taskId: string;
  author: string;
  body: string;
  kind: 'user' | 'system';
  createdAt: string;
};

const statuses: BoardStatus[] = [
  { id: 'todo', title: 'К выполнению', icon: '📋', color: 'bg-slate-100' },
  { id: 'inprogress', title: 'В работе', icon: '🚀', color: 'bg-blue-100' },
  { id: 'done', title: 'Выполнено', icon: '✅', color: 'bg-green-100' },
];

const seedChats = (tasks: Task[]): Record<number, ChatMessage[]> => {
  return tasks.reduce<Record<number, ChatMessage[]>>((acc, task) => {
    acc[task.id] = [
      {
        id: `sys-${task.id}-1`,
        taskId: task.id,
        author: 'Система',
        body: `Задача создана: «${task.title}»`,
        kind: 'system',
        createdAt: new Date(task.createdAt).toLocaleString('ru-RU'),
      },
      {
        id: `sys-${task.id}-2`,
        taskId: task.id,
        author: 'Система',
        body: `${task.assignee} назначен(а) исполнителем`,
        kind: 'system',
        createdAt: new Date(task.updatedAt).toLocaleString('ru-RU'),
      },
    ];
    return acc;
  }, {});
};

export default function TaskBoard() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [taskFilter, setTaskFilter] = useState<'all' | 'my'>('all');
  const [filters, setFilters] = useState({
    priority: 'all',
    status: 'all',
    assignee: 'all',
  });

  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState('');

  const {
    tasks,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    getStats,
    getFilteredTasks,
    getUserTasks,
    getDeadlineStatus,
  } = useTasks();

  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { addToast } = useToast();

  const [taskChats, setTaskChats] = useState<Record<number, ChatMessage[]>>(() => seedChats(tasks));
  const [loadedChats, setLoadedChats] = useState<Record<number, boolean>>({});
  const [unreadByTask, setUnreadByTask] = useState<Record<number, number>>(() => {
    return tasks.reduce<Record<number, number>>((acc, t) => {
      acc[t.id] = t.status === 'done' ? 0 : 1;
      return acc;
    }, {});
  });

  const baseTasks = useMemo(() => {
    if (taskFilter === 'my' && user) return getUserTasks(user.id);
    return tasks;
  }, [taskFilter, user, getUserTasks, tasks]);

  const filteredTasks = useMemo(() => {
    return getFilteredTasks({ query: searchQuery, ...filters }, baseTasks);
  }, [baseTasks, filters, searchQuery, getFilteredTasks]);

  const selectedTask = useMemo(
    () => filteredTasks.find((task) => task.id === selectedTaskId) ?? tasks.find((task) => task.id === selectedTaskId) ?? null,
    [filteredTasks, selectedTaskId, tasks]
  );

  const selectedChat = selectedTask ? taskChats[selectedTask.id] ?? [] : [];
  const getApiTaskId = (taskId: number) => `task-${taskId}`;

  const ensureChatThread = (task: Task) => {
    setTaskChats((prev) => {
      if (prev[task.id]) return prev;
      return {
        ...prev,
        [task.id]: [
          {
            id: `sys-${task.id}-new`,
            taskId: task.id,
            author: 'Система',
            body: `Открыт контекстный чат для задачи «${task.title}»`,
            kind: 'system',
            createdAt: new Date().toLocaleString('ru-RU'),
          },
        ],
      };
    });
  };

  const openTaskContext = (task: Task) => {
    ensureChatThread(task);
    setSelectedTaskId(task.id);
    setUnreadByTask((prev) => ({ ...prev, [task.id]: 0 }));
  };

  useEffect(() => {
    const loadChatHistory = async () => {
      if (!selectedTask || loadedChats[selectedTask.id]) return;

      try {
        const token = localStorage.getItem('bug-tracker-token');
        const response = await fetch(`/api/tasks/${getApiTaskId(selectedTask.id)}/messages`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load messages: ${response.status}`);
        }

        const result = await response.json();
        const messages = (result?.data ?? []) as ApiMessage[];
        const mapped: ChatMessage[] = messages.map((msg) => ({
          id: `api-${msg.id}`,
          taskId: selectedTask.id,
          author: msg.author,
          body: msg.body,
          kind: msg.kind,
          createdAt: new Date(msg.createdAt).toLocaleString('ru-RU'),
        }));

        setTaskChats((prev) => ({
          ...prev,
          [selectedTask.id]: mapped.length > 0 ? mapped : prev[selectedTask.id] ?? [],
        }));
      } catch (error) {
        console.warn('Failed to load chat history for task', selectedTask.id, error);
      } finally {
        setLoadedChats((prev) => ({ ...prev, [selectedTask.id]: true }));
      }
    };

    loadChatHistory();
  }, [loadedChats, selectedTask]);

  const addSystemMessage = (taskId: number, body: string) => {
    setTaskChats((prev) => {
      const existing = prev[taskId] ?? [];
      return {
        ...prev,
        [taskId]: [
          ...existing,
          {
            id: `sys-${taskId}-${Date.now()}`,
            taskId,
            author: 'Система',
            body,
            kind: 'system',
            createdAt: new Date().toLocaleString('ru-RU'),
          },
        ],
      };
    });
  };

  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    if (!user) return;
    try {
      const created = await createTask(taskData, user.id);
      addNotification(`Создана новая задача: ${taskData.title}`, 'task');
      addToast(`Задача «${taskData.title}» создана`, 'success');
      if (created) {
        const taskId = created.id;
        setTaskChats((prev) => ({
          ...prev,
          [taskId]: [
            {
              id: `sys-${taskId}-create`,
              taskId,
              author: 'Система',
              body: `Задача создана и назначена: ${taskData.assignee}`,
              kind: 'system',
              createdAt: new Date().toLocaleString('ru-RU'),
            },
          ],
        }));
        setUnreadByTask((prev) => ({ ...prev, [taskId]: 0 }));
      }
    } catch {
      addToast('Ошибка при создании задачи', 'error');
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      await updateTask(updatedTask.id, updatedTask);
      addSystemMessage(updatedTask.id, `Поля задачи обновлены пользователем ${user?.name || 'пользователь'}`);
      addToast(`Задача «${updatedTask.title}» обновлена`, 'success');
    } catch {
      addToast('Ошибка при обновлении задачи', 'error');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Удалить задачу?')) return;
    try {
      await deleteTask(taskId);
      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
      }
      addToast('Задача удалена', 'info');
    } catch {
      addToast('Ошибка при удалении задачи', 'error');
    }
  };

  const handleDrop = async (e: React.DragEvent, status: StatusType) => {
    e.preventDefault();
    if (!draggedTask) return;

    try {
      await moveTask(draggedTask.id, status);
      addSystemMessage(
        draggedTask.id,
        `Статус изменен: ${draggedTask.status} → ${status}`
      );
      setUnreadByTask((prev) => ({
        ...prev,
        [draggedTask.id]: selectedTaskId === draggedTask.id ? 0 : (prev[draggedTask.id] ?? 0) + 1,
      }));
      addToast(`Задача «${draggedTask.title}» перемещена`, 'info');
    } catch {
      addToast('Ошибка при перемещении', 'error');
    } finally {
      setDraggedTask(null);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTask || !chatInput.trim()) return;

    const author = user?.name || 'Пользователь';
    const body = chatInput.trim();
    setChatInput('');

    try {
      const token = localStorage.getItem('bug-tracker-token');
      const response = await fetch(`/api/tasks/${getApiTaskId(selectedTask.id)}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          author,
          body,
          kind: 'user',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create message: ${response.status}`);
      }

      const result = await response.json();
      const created = result?.data as ApiMessage | undefined;
      if (!created) return;

      const message: ChatMessage = {
        id: `api-${created.id}`,
        taskId: selectedTask.id,
        author: created.author,
        body: created.body,
        kind: created.kind,
        createdAt: new Date(created.createdAt).toLocaleString('ru-RU'),
      };

      setTaskChats((prev) => ({
        ...prev,
        [selectedTask.id]: [...(prev[selectedTask.id] ?? []), message],
      }));
    } catch {
      addToast('Ошибка при отправке сообщения', 'error');
    }
  };

  const formatDeadline = (deadline: Date | null) => {
    if (!deadline) return 'Без дедлайна';
    return new Date(deadline).toLocaleDateString('ru-RU');
  };

  const getPriorityText = (priority: string) => {
    if (priority === 'high') return 'Высокий';
    if (priority === 'low') return 'Низкий';
    return 'Средний';
  };

  const getPriorityClasses = (priority: string) => {
    if (priority === 'high') return 'bg-red-100 text-red-700';
    if (priority === 'low') return 'bg-emerald-100 text-emerald-700';
    return 'bg-amber-100 text-amber-700';
  };

  const filteredStats = {
    total: filteredTasks.length,
    todo: filteredTasks.filter((t) => t.status === 'todo').length,
    inprogress: filteredTasks.filter((t) => t.status === 'inprogress').length,
    done: filteredTasks.filter((t) => t.status === 'done').length,
  };

  return (
    <div className="p-6 relative">
      <TaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onTaskCreate={handleCreateTask}
        currentUser={user || { id: '0', name: 'Пользователь' }}
      />

      <EditTaskModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onTaskUpdate={handleUpdateTask}
        task={editingTask}
      />

      <SearchBar onSearch={setSearchQuery} onFilterChange={setFilters} />

      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Мои задачи</h2>
          <p className="text-slate-600">Единое место для задач, назначений и обсуждений внутри карточки.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setTaskFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm ${taskFilter === 'all' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
            >
              Все задачи
            </button>
            <button
              onClick={() => setTaskFilter('my')}
              className={`px-4 py-2 rounded-lg text-sm ${taskFilter === 'my' ? 'bg-white shadow text-slate-900' : 'text-slate-600'}`}
            >
              Мои задачи
            </button>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl"
          >
            + Создать задачу
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statuses.map((status) => {
          const columnTasks = filteredTasks.filter((task) => task.status === status.id);

          return (
            <div
              key={status.id}
              className={`rounded-2xl p-4 ${status.color} min-h-[440px]`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, status.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  {status.icon} {status.title}
                </h3>
                <span className="bg-white text-slate-700 px-2 py-1 text-sm rounded-full">{columnTasks.length}</span>
              </div>

              <div className="space-y-3">
                {columnTasks.map((task) => {
                  const unread = unreadByTask[task.id] ?? 0;
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => setDraggedTask(task)}
                      onClick={() => openTaskContext(task)}
                      className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="font-semibold text-slate-900 leading-snug">{task.title}</h4>
                        {unread > 0 && (
                          <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">{unread}</span>
                        )}
                      </div>

                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{task.description || 'Без описания'}</p>

                      <div className="flex items-center gap-2 mb-3 flex-wrap text-xs">
                        <span className={`px-2 py-1 rounded-full ${getPriorityClasses(task.priority)}`}>
                          {getPriorityText(task.priority)}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                          Дедлайн: {formatDeadline(task.deadline)}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                          {getDeadlineStatus(task) === 'danger' ? 'Просрочено' : 'В срок'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Исполнитель: {task.assignee}</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTask(task);
                              setIsEditOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Ред.
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            Удал.
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {columnTasks.length === 0 && (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-400">
                    Перетащите задачи сюда
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <div className="text-2xl font-bold text-slate-900">{filteredStats.total}</div>
          <div className="text-sm text-slate-600">Всего задач</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <div className="text-2xl font-bold text-amber-600">{filteredStats.todo}</div>
          <div className="text-sm text-slate-600">К выполнению</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <div className="text-2xl font-bold text-blue-600">{filteredStats.inprogress}</div>
          <div className="text-sm text-slate-600">В работе</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
          <div className="text-2xl font-bold text-emerald-600">{filteredStats.done}</div>
          <div className="text-sm text-slate-600">Выполнено</div>
        </div>
      </div>

      {selectedTask && (
        <div className="fixed top-0 right-0 h-full w-full sm:w-[520px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col">
          <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">Задача = Чат</p>
              <h3 className="text-xl font-bold text-slate-900">{selectedTask.title}</h3>
              <div className="text-sm text-slate-600 mt-1 flex flex-wrap gap-2">
                <span>Исполнитель: {selectedTask.assignee}</span>
                <span>•</span>
                <span>Дедлайн: {formatDeadline(selectedTask.deadline)}</span>
                <span>•</span>
                <span>Статус: {selectedTask.status}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTaskId(null)}
              className="text-slate-500 hover:text-slate-800 text-lg"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50">
            {selectedChat.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-xl p-3 ${msg.kind === 'system' ? 'bg-blue-50 border border-blue-100' : 'bg-white border border-slate-200'}`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={msg.kind === 'system' ? 'text-blue-700 font-semibold' : 'text-slate-700 font-semibold'}>
                    {msg.author}
                  </span>
                  <span className="text-slate-500">{msg.createdAt}</span>
                </div>
                <p className="text-sm text-slate-800">{msg.body}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 p-4">
            <div className="flex items-end gap-2">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Напишите сообщение по задаче..."
                rows={2}
                className="flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl"
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
