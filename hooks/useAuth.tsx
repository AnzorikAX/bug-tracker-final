'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from './useLocalStorage';

export type User = {
  id: number;
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  avatar?: string;
  createdAt: string;
  lastLogin: string;
};

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

type AuthContextType = AuthState & {
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'> & { password: string }) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
};

// Демо-пользователи
const demoUsers: (User & { password: string })[] = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    email: 'admin@bugtracker.com',
    name: 'Администратор Системы',
    role: 'admin',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  },
  {
    id: 2,
    username: 'developer',
    password: 'dev123',
    email: 'dev@company.com',
    name: 'Иван Разработчик',
    role: 'user',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  },
  {
    id: 3,
    username: 'manager',
    password: 'manager123',
    email: 'manager@company.com',
    name: 'Мария Менеджер',
    role: 'user',
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  const [users, setUsers] = useLocalStorage<(User & { password: string })[]>('bug-tracker-users', demoUsers);

  // Инициализация при загрузке - проверяем сохраненную сессию
  useEffect(() => {
    const initializeAuth = () => {
      try {
        // Проверяем, есть ли сохраненный пользователь в localStorage
        const savedAuth = localStorage.getItem('bug-tracker-auth');
        if (savedAuth) {
          const parsedAuth = JSON.parse(savedAuth);
          if (parsedAuth.user && parsedAuth.isAuthenticated) {
            setAuthState({
              user: parsedAuth.user,
              isAuthenticated: true,
              isLoading: false
            });
            return;
          }
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
      }

      // Если нет сохраненной сессии
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    };

    initializeAuth();
  }, []);

  // Функция для сохранения состояния в localStorage
  const saveAuthState = (newState: AuthState) => {
    setAuthState(newState);
    try {
      localStorage.setItem('bug-tracker-auth', JSON.stringify(newState));
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      const updatedUser = {
        ...userWithoutPassword,
        lastLogin: new Date().toISOString()
      };

      const newAuthState = {
        user: updatedUser,
        isAuthenticated: true,
        isLoading: false
      };

      saveAuthState(newAuthState);

      // Обновляем пользователя в списке
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, lastLogin: updatedUser.lastLogin } : u
      ));

      return true;
    }
    
    return false;
  };

  const register = async (userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'> & { password: string }): Promise<boolean> => {
    // Проверяем, нет ли пользователя с таким username или email
    const existingUser = users.find(u => 
      u.username === userData.username || u.email === userData.email
    );

    if (existingUser) {
      return false;
    }

    const newUser = {
      ...userData,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    setUsers(prev => [...prev, newUser]);

    // Автоматически логиним после регистрации
    const { password: _, ...userWithoutPassword } = newUser;
    const newAuthState = {
      user: userWithoutPassword,
      isAuthenticated: true,
      isLoading: false
    };

    saveAuthState(newAuthState);

    return true;
  };

  const logout = () => {
    const newAuthState = {
      user: null,
      isAuthenticated: false,
      isLoading: false
    };
    
    saveAuthState(newAuthState);
    
    // Очищаем localStorage
    try {
      localStorage.removeItem('bug-tracker-auth');
    } catch (error) {
      console.error('Error clearing auth state:', error);
    }
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!authState.user) return;

    const updatedUser = { ...authState.user, ...updates };
    
    const newAuthState = {
      ...authState,
      user: updatedUser
    };

    saveAuthState(newAuthState);
    
    // Обновляем в общем списке пользователей
    setUsers(prev => prev.map(u => 
      u.id === updatedUser.id ? { ...u, ...updates } : u
    ));
  };

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}