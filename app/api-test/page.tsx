"use client";

import { useState } from 'react';

type TestResult = {
  endpoint: string;
  method: string;
  status: string;
  response: any;
  error?: string;
};

export default function ApiTestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const apiRequest = async (url: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(`/api${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      return { status: response.status, data };
    } catch (error: any) {
      return { status: 'ERROR', data: null, error: error.message };
    }
  };

  const testAllEndpoints = async () => {
  setIsTesting(true);
  setResults([]);

  let authToken = '';

  const tests = [
    // Auth endpoints
    { endpoint: '/auth/me', method: 'GET', requiresAuth: true },
    { endpoint: '/auth/login', method: 'POST', body: { email: 'admin@bugtracker.com', password: 'password123' } },
    { endpoint: '/auth/register', method: 'POST', body: { email: `test${Date.now()}@test.com`, name: 'Test User', password: 'password123' } },
    
    // Users endpoints
    { endpoint: '/users', method: 'GET' },
    { endpoint: '/users', method: 'POST', body: { email: `newuser${Date.now()}@test.com`, name: 'New User', password: 'password123', role: 'user' } },
    
    // Tasks endpoints
    { endpoint: '/tasks', method: 'GET' },
    { endpoint: '/tasks', method: 'POST', body: { title: 'Test Task', description: 'Test Description', priority: 'medium', assignee: 'admin-1' } },
  ];

  for (const test of tests) {
    console.log(`🧪 Testing: ${test.method} ${test.endpoint}`);
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Добавляем токен если требуется аутентификация
    if (test.requiresAuth && authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const result = await apiRequest(test.endpoint, {
      method: test.method,
      headers,
      body: test.body ? JSON.stringify(test.body) : undefined,
    });

    // Сохраняем токен после успешного логина
    if (test.endpoint === '/auth/login' && result.status === 200 && result.data?.data?.token) {
      authToken = result.data.data.token;
      console.log('🔑 Token saved for subsequent requests');
    }

    setResults(prev => [...prev, {
      endpoint: test.endpoint,
      method: test.method,
      status: result.status === 'ERROR' ? 'ERROR' : result.status.toString(),
      response: result.data,
      error: result.error
    }]);

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  setIsTesting(false);
};

  const getStatusColor = (status: string) => {
    if (status === 'ERROR') return 'text-red-600';
    if (status.startsWith('2')) return 'text-green-600';
    if (status.startsWith('4')) return 'text-orange-600';
    if (status.startsWith('5')) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">🧪 API Тестирование</h1>
        
        <div className="mb-6">
          <button
            onClick={testAllEndpoints}
            disabled={isTesting}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTesting ? 'Тестирование...' : 'Запустить тесты API'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Результаты тестирования:</h2>
            
            {results.map((result, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-mono font-bold">{result.method}</span>
                    <span className="font-mono text-gray-600 ml-2">{result.endpoint}</span>
                  </div>
                  <span className={`font-bold ${getStatusColor(result.status)}`}>
                    {result.status}
                  </span>
                </div>
                
                {result.error ? (
                  <div className="text-red-600 text-sm">
                    <strong>Ошибка:</strong> {result.error}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    <strong>Ответ:</strong> {JSON.stringify(result.response, null, 2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Статистика */}
        {results.length > 0 && (
          <div className="mt-6 p-4 bg-white rounded-lg shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">Статистика:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{results.length}</div>
                <div className="text-sm text-gray-600">Всего тестов</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {results.filter(r => r.status.startsWith('2')).length}
                </div>
                <div className="text-sm text-gray-600">Успешно</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {results.filter(r => r.status.startsWith('4')).length}
                </div>
                <div className="text-sm text-gray-600">Ошибки клиента</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {results.filter(r => r.status.startsWith('5') || r.status === 'ERROR').length}
                </div>
                <div className="text-sm text-gray-600">Ошибки сервера</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}