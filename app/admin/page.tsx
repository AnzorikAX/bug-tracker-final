'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTasks } from '../../hooks/useTasks';
import { useNotifications } from '../../hooks/useNotifications';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import UserModal from '../../components/UserModal';
import ResetPasswordModal from '../../components/ResetPasswordModal';
import { User } from '../../hooks/useAuth';

export default function AdminPage() {
  const { user, getAllUsers, createUser } = useAuth(); // ← УБРАЛ старые функции которых нет
  const { tasks, clearAllTasks, restoreDemoData, exportTasks, getStats } = useTasks();
  const { notifications, clearAll: clearAllNotifications } = useNotifications();
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'system'>('stats');
  const router = useRouter();

  // Состояния для управления пользователями
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(5);
  
  // Состояния для модальных окон
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userModalMode, setUserModalMode] = useState<'create' | 'edit'>('create');

  // 🔥 ИСПРАВЛЕНИЕ: Асинхронная загрузка пользователей
  useEffect(() => {
    const loadUsers = async () => {
      if (user?.role === 'admin') {
        setIsLoadingUsers(true);
        try {
          console.log('🔄 Loading users for admin...');
          const allUsers = await getAllUsers();
          console.log('✅ Users loaded:', allUsers);
          setUsers(allUsers || []);
        } catch (error) {
          console.error('❌ Failed to load users:', error);
          setUsers([]);
        } finally {
          setIsLoadingUsers(false);
        }
      }
    };

    loadUsers();
  }, [getAllUsers, user?.role]);

  // Проверяем права администратора
  if (user?.role !== 'admin') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Доступ запрещен</h1>
            <p className="text-gray-600">У вас недостаточно прав для просмотра этой страницы</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              ← Вернуться на главную
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const stats = getStats();

  const systemInfo = {
    totalUsers: users.length,
    activeSessions: 1,
    storageUsed: `${Math.round(JSON.stringify(tasks).length / 1024)} KB`,
    lastBackup: new Date().toLocaleDateString('ru-RU')
  };

  // 🔥 ИСПРАВЛЕНИЕ: Очищаем данные перед отправкой в API
const handleCreateUser = async (userData: any) => {
  console.log('🔄 Admin: Creating user with data:', userData);
  
  // Оставляем только поля которые понимает API
  const cleanUserData = {
    email: userData.email,
    name: userData.name,
    password: userData.password,
    role: userData.role || 'user'
  };
  
  console.log('🧹 Admin: Cleaned user data for API:', cleanUserData);

  try {
    const success = await createUser(cleanUserData);
    console.log('📊 Admin: Create user result:', success);
    
    if (success) {
      // Обновляем список пользователей
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      return true;
    } else {
      console.error('❌ Admin: Failed to create user');
      return false;
    }
  } catch (error) {
    console.error('💥 Admin: Exception in create user:', error);
    return false;
  }
};

  const handleUpdateUser = async (userData: any) => {
    alert('Редактирование пользователей через API временно недоступно');
    return false;
  };

  const handleDeleteUser = (userId: string) => { // ← ИЗМЕНИТЬ НА string
    alert('Удаление пользователей через API временно недоступно');
  };

  const handleChangeRole = (userId: string, newRole: 'admin' | 'user') => { // ← ИЗМЕНИТЬ НА string
    alert('Изменение ролей через API временно недоступно');
  };

  const handleResetPassword = (userId: string, newPassword: string) => { // ← ИЗМЕНИТЬ НА string
    alert('Сброс паролей через API временно недоступно');
    return false;
  };

  // Функции для открытия модальных окон
  const openCreateUserModal = () => {
    setEditingUser(null);
    setUserModalMode('create');
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (user: User) => {
    setEditingUser(user);
    setUserModalMode('edit');
    setIsUserModalOpen(true);
  };

  const openResetPasswordModal = (user: User) => {
    setEditingUser(user);
    setIsResetPasswordModalOpen(true);
  };

  // Фильтрация и поиск пользователей
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
                         // ← УБРАЛ username которого нет в новом API
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Пагинация
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handleClearAllData = () => {
    if (confirm('Вы уверены, что хотите удалить ВСЕ данные? Это действие нельзя отменить!')) {
      clearAllTasks();
      clearAllNotifications();
    }
  };

  const handleExportData = () => {
    exportTasks();
  };

  const handleBackToMain = () => {
    router.push('/');
  };

  // Статистика пользователей
  const userStats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    regularUsers: users.filter(u => u.role === 'user').length,
    activeToday: users.length // ← УПРОЩЕННАЯ СТАТИСТИКА
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Заголовок с кнопкой назад */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Панель администратора</h1>
                <p className="text-gray-600">Управление системой и пользователями</p>
              </div>
              <button
                onClick={handleBackToMain}
                className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <span>←</span>
                <span>Назад</span>
              </button>
            </div>
          </div>

          {/* Навигация по табам */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'stats'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📊 Статистика
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'users'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                👥 Пользователи ({users.length})
                {isLoadingUsers && ' 🔄'}
              </button>
              <button
                onClick={() => setActiveTab('system')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'system'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                ⚙️ Система
              </button>
            </div>

            {/* Содержимое табов */}
            <div className="p-6">
              {activeTab === 'stats' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-800">Статистика системы</h2>
                  
                  {/* ... (статистика задач остается без изменений) ... */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                      <div className="text-sm text-gray-600">Всего задач</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats.done}</div>
                      <div className="text-sm text-gray-600">Выполнено</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{stats.inprogress}</div>
                      <div className="text-sm text-gray-600">В работе</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{stats.highPriority}</div>
                      <div className="text-sm text-gray-600">Высокий приоритет</div>
                    </div>
                  </div>

                  {/* ... (остальная статистика без изменений) ... */}
                </div>
              )}

              {activeTab === 'users' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">Управление пользователями</h2>
                    <button
                      onClick={openCreateUserModal}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                      disabled={isLoadingUsers}
                    >
                      <span>+</span>
                      <span>Создать пользователя</span>
                    </button>
                  </div>

                  {isLoadingUsers ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Загрузка пользователей...</p>
                    </div>
                  ) : (
                    <>
                      {/* Статистика пользователей */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{userStats.total}</div>
                          <div className="text-sm text-gray-600">Всего пользователей</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{userStats.admins}</div>
                          <div className="text-sm text-gray-600">Администраторов</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{userStats.regularUsers}</div>
                          <div className="text-sm text-gray-600">Обычных пользователей</div>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{userStats.activeToday}</div>
                          <div className="text-sm text-gray-600">Активных пользователей</div>
                        </div>
                      </div>

                      {/* Фильтры и поиск */}
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Поиск по имени или email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="w-full md:w-48">
                          <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as any)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="all">Все роли</option>
                            <option value="admin">Администраторы</option>
                            <option value="user">Пользователи</option>
                          </select>
                        </div>
                      </div>

                      {/* Таблица пользователей */}
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Пользователь
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Роль
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Действия
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {currentUsers.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                    {searchTerm || roleFilter !== 'all' ? 'Пользователи не найдены' : 'Нет пользователей'}
                                  </td>
                                </tr>
                              ) : (
                                currentUsers.map((user) => (
                                  <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                          {user.name.charAt(0)}
                                        </div>
                                        <div className="ml-4">
                                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                          <div className="text-sm text-gray-500">{user.email}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        user.role === 'admin' 
                                          ? 'bg-purple-100 text-purple-800' 
                                          : 'bg-green-100 text-green-800'
                                      }`}>
                                        {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {user.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                      <button
                                        onClick={() => openEditUserModal(user)}
                                        className="text-blue-600 hover:text-blue-900"
                                      >
                                        Редактировать
                                      </button>
                                      <button
                                        onClick={() => openResetPasswordModal(user)}
                                        className="text-orange-600 hover:text-orange-900"
                                      >
                                        Сбросить пароль
                                      </button>
                                      {user.role === 'user' ? (
                                        <button
                                          onClick={() => handleChangeRole(user.id, 'admin')}
                                          className="text-purple-600 hover:text-purple-900"
                                        >
                                          Сделать админом
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleChangeRole(user.id, 'user')}
                                          className="text-green-600 hover:text-green-900"
                                        >
                                          Сделать пользователем
                                        </button>
                                      )}
                                      {user.id !== user?.id && (
                                        <button
                                          onClick={() => handleDeleteUser(user.id)}
                                          className="text-red-600 hover:text-red-900"
                                        >
                                          Удалить
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Пагинация */}
                        {totalPages > 1 && (
                          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                            <div className="text-sm text-gray-700">
                              Показано {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} из {filteredUsers.length}
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Назад
                              </button>
                              <span className="px-3 py-1 text-sm text-gray-700">
                                Страница {currentPage} из {totalPages}
                              </span>
                              <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Вперед
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'system' && (
                <div className="space-y-6">
                  {/* ... (системные настройки без изменений) ... */}
                </div>
              )}
            </div>
          </div>

          {/* Модальные окна */}
          <UserModal
            isOpen={isUserModalOpen}
            onClose={() => setIsUserModalOpen(false)}
            onSave={userModalMode === 'create' ? handleCreateUser : handleUpdateUser}
            user={editingUser}
            mode={userModalMode}
          />

          <ResetPasswordModal
            isOpen={isResetPasswordModalOpen}
            onClose={() => setIsResetPasswordModalOpen(false)}
            onReset={handleResetPassword}
            user={editingUser}
          />

          {/* Дополнительная кнопка назад внизу */}
          <div className="text-center">
            <button
              onClick={handleBackToMain}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2 mx-auto"
            >
              <span>←</span>
              <span>Вернуться к задачам</span>
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}