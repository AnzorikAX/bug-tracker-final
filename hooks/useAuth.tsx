"use client";

import { useState, useEffect, createContext, useContext } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, name: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  getAllUsers: () => Promise<User[]>;
  createUser: (userData: { email: string; name: string; password: string; role?: 'admin' | 'user' }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Проверяем аутентификацию при загрузке
  useEffect(() => {
    checkAuth();
  }, []);

  // 🔄 API запрос с улучшенной обработкой ошибок И ПЕРЕДАЧЕЙ ТОКЕНА
  const apiRequest = async (url: string, options: RequestInit = {}) => {
    try {
      console.log(`🔄 API Request: ${url}`, options);
      
      // 🔥 ВСЕГДА ДОБАВЛЯЕМ ТОКЕН К ЗАПРОСАМ
      const token = localStorage.getItem('bug-tracker-token');
      
      const response = await fetch(`/api${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }), // 🔥 ДОБАВЛЕНО
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      console.log(`📊 API Response: ${url}`, { status: response.status, data });
      
      // Проверяем как статус ответа, так и success флаг в данных
      if (!response.ok || !data.success) {
        const errorMessage = data.error || `Request failed with status ${response.status}`;
        console.error(`❌ API Error: ${url}`, errorMessage);
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error(`💥 API Request failed: ${url}`, error);
      throw error;
    }
  };

  // 🔐 Проверка аутентификации
  const checkAuth = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('bug-tracker-token');
      
      if (!token) {
        console.log('🔐 No token found');
        setUser(null);
        return;
      }

      console.log('🔐 Checking auth with token...');
      const data = await apiRequest('/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (data.success && data.data.user) {
        console.log('✅ Auth check successful:', data.data.user.email);
        setUser(data.data.user);
      } else {
        console.log('❌ Auth check failed - invalid token');
        localStorage.removeItem('bug-tracker-token');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      localStorage.removeItem('bug-tracker-token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔑 Логин
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      console.log('🔐 Login attempt:', email);
      
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      console.log('📊 Login response:', data);

      if (data.success && data.data.token && data.data.user) {
        // Сохраняем токен и пользователя
        localStorage.setItem('bug-tracker-token', data.data.token);
        setUser(data.data.user);
        console.log('✅ Login successful, user set:', data.data.user.email);
        return { success: true };
      } else {
        console.log('❌ Login failed - no token or user in response');
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error: any) {
      console.error('💥 Login failed with error:', error);
      return { success: false, error: error.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  // 📝 Регистрация
  const register = async (email: string, name: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, name, password })
      });

      if (data.success && data.data.token && data.data.user) {
        // Сохраняем токен и пользователя
        localStorage.setItem('bug-tracker-token', data.data.token);
        setUser(data.data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      return { success: false, error: error.message || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  // 🚪 Выход
  const logout = (): void => {
    console.log('🚪 Logging out...');
    localStorage.removeItem('bug-tracker-token');
    setUser(null);
  };

  // 🔍 Получение всех пользователей (ОБНОВЛЕННАЯ - С ТОКЕНОМ)
  const getAllUsers = async (): Promise<User[]> => {
    try {
      console.log('🔍 Fetching all users from API...');
      const token = localStorage.getItem('bug-tracker-token');
      console.log('🔑 Token for users request:', token ? 'present' : 'missing');
      
      // 🔥 ЯВНО ПЕРЕДАЕМ ТОКЕН ДЛЯ ЗАЩИЩЕННОГО ЭНДПОИНТА
      const data = await apiRequest('/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Users fetched:', data.data?.length || 0);
      return data.data || [];
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      return [];
    }
  };

  // 👤 Создание пользователя (ОБНОВЛЕННАЯ - С ТОКЕНОМ)
  const createUser = async (userData: {
    email: string;
    name: string;
    password: string;
    role?: 'admin' | 'user';
  }): Promise<boolean> => {
    try {
      console.log('👤 Creating user:', userData);
      const token = localStorage.getItem('bug-tracker-token');
      
      // 🔥 ЯВНО ПЕРЕДАЕМ ТОКЕН ДЛЯ ЗАЩИЩЕННОГО ЭНДПОИНТА
      const data = await apiRequest('/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      console.log('📊 Create user response:', data);

      if (data.success) {
        console.log('✅ User created successfully:', userData.email);
        return true;
      } else {
        console.log('❌ Create user failed - API returned error:', data.error);
        return false;
      }
    } catch (error: any) {
      console.error('💥 Error creating user:', error);
      console.error('💥 Error details:', error.message, error.stack);
      return false;
    }
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
    getAllUsers,
    createUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Хук для использования аутентификации
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}