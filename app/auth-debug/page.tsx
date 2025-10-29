"use client";

import { useState } from 'react';

export default function AuthDebug() {
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testAuthFlow = async () => {
    addLog('🚀 Начинаем тест аутентификации...');
    
    // 1. Регистрация
    addLog('📝 Пытаемся зарегистрировать пользователя...');
    try {
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: "debug@example.com",
          name: "Debug User", 
          password: "password123"
        })
      });
      
      const registerData = await registerResponse.json();
      addLog(`📝 Регистрация: ${registerResponse.status} - ${JSON.stringify(registerData)}`);
      
      if (registerData.success) {
        addLog('✅ Регистрация успешна!');
        
        // 2. Логин
        addLog('🔐 Пытаемся войти...');
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: "debug@example.com",
            password: "password123"
          })
        });
        
        const loginData = await loginResponse.json();
        addLog(`🔐 Логин: ${loginResponse.status} - ${JSON.stringify(loginData)}`);
        
        if (loginData.success) {
          addLog('✅ Логин успешен!');
          
          // 3. Проверка токена
          addLog('🔍 Проверяем токен...');
          const meResponse = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${loginData.data.token}`
            }
          });
          
          const meData = await meResponse.json();
          addLog(`🔍 /api/auth/me: ${meResponse.status} - ${JSON.stringify(meData)}`);
          
        } else {
          addLog('❌ Логин не удался');
        }
      } else {
        addLog('❌ Регистрация не удалась');
      }
    } catch (error: any) {
      addLog(`💥 Ошибка: ${error.message}`);
    }
  };

  const testExistingUsers = async () => {
    addLog('👥 Проверяем существующих пользователей...');
    
    try {
      const usersResponse = await fetch('/api/users');
      const usersData = await usersResponse.json();
      
      if (usersData.success) {
        addLog(`📊 Найдено пользователей: ${usersData.data.length}`);
        usersData.data.forEach((user: any) => {
          addLog(`   - ${user.email} (${user.name}) - ID: ${user.id}`);
        });
        
        // Пробуем войти под каждым пользователем
        for (const user of usersData.data) {
          addLog(`🔐 Пробуем войти как ${user.email}...`);
          
          const loginResponse = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email,
              password: "password123"
            })
          });
          
          const loginData = await loginResponse.json();
          addLog(`   ${user.email}: ${loginResponse.status} - ${loginData.success ? '✅ УСПЕХ' : '❌ ОШИБКА'}`);
        }
      }
    } catch (error: any) {
      addLog(`💥 Ошибка: ${error.message}`);
    }
  };

  const clearLog = () => {
    setLog([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-4">🐛 Debug Аутентификации</h1>
      
      <div className="space-x-4 mb-4">
        <button 
          onClick={testAuthFlow}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Тест полного цикла
        </button>
        <button 
          onClick={testExistingUsers}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Тест существующих пользователей
        </button>
        <button 
          onClick={clearLog}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Очистить лог
        </button>
      </div>

      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
        {log.length === 0 ? (
          <div className="text-gray-500">Нажмите кнопки для тестирования...</div>
        ) : (
          log.map((entry, index) => (
            <div key={index} className="whitespace-pre-wrap">{entry}</div>
          ))
        )}
      </div>
    </div>
  );
}