"use client";

import { useState } from 'react';

export default function LoginDebug() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testLogin = async (testEmail: string, testPassword: string) => {
    addLog(`🔐 Тестируем логин: ${testEmail} / ${testPassword}`);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      });
      
      const data = await response.json();
      addLog(`📊 Ответ: ${response.status} - ${JSON.stringify(data)}`);
      
      if (data.success) {
        addLog('🎉 УСПЕХ! Токен получен');
        // Проверяем токен
        const meResponse = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${data.data.token}`
          }
        });
        const meData = await meResponse.json();
        addLog(`🔍 Проверка токена: ${meResponse.status} - ${JSON.stringify(meData)}`);
      } else {
        addLog(`❌ ОШИБКА: ${data.error}`);
      }
    } catch (error: any) {
      addLog(`💥 Исключение: ${error.message}`);
    }
  };

  const testAllUsers = async () => {
    addLog('👥 Тестируем всех пользователей...');
    
    // Получаем список пользователей
    const usersResponse = await fetch('/api/users');
    const usersData = await usersResponse.json();
    
    if (usersData.success) {
      for (const user of usersData.data) {
        await testLogin(user.email, 'password123');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-4">🐛 Debug Логина</h1>
      
      <div className="space-y-4 mb-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded"
        />
        <button 
          onClick={() => testLogin(email, password)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Тест логина
        </button>
        <button 
          onClick={testAllUsers}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Тест всех пользователей
        </button>
      </div>

      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
        {log.map((entry, index) => (
          <div key={index} className="whitespace-pre-wrap">{entry}</div>
        ))}
      </div>
    </div>
  );
}