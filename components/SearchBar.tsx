'use client';

import { useState } from 'react';

type SearchBarProps = {
  onSearch: (query: string) => void;
  onFilterChange: (filters: {
    priority: string;
    status: string;
    assignee: string;
  }) => void;
};

export default function SearchBar({ onSearch, onFilterChange }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    priority: 'all',
    status: 'all',
    assignee: 'all'
  });

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      priority: 'all',
      status: 'all',
      assignee: 'all'
    };
    setFilters(clearedFilters);
    setSearchQuery('');
    onFilterChange(clearedFilters);
    onSearch('');
  };

  const hasActiveFilters = filters.priority !== 'all' || filters.status !== 'all' || filters.assignee !== 'all' || searchQuery;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Поисковая строка */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            🔍
          </div>
          <input
            type="text"
            placeholder="Поиск по названию, описанию или исполнителю..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            ⚙️ Фильтры
            {hasActiveFilters && (
              <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                !
              </span>
            )}
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
            >
              ❌ Очистить
            </button>
          )}
        </div>
      </div>

      {/* Расширенные фильтры */}
      {isFiltersOpen && (
        <div className="border-t pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Фильтр по приоритету */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Приоритет
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Все приоритеты</option>
                <option value="high">🔴 Высокий</option>
                <option value="medium">🟡 Средний</option>
                <option value="low">🟢 Низкий</option>
              </select>
            </div>

            {/* Фильтр по статусу */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Статус
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Все статусы</option>
                <option value="todo">📋 К выполнению</option>
                <option value="inprogress">🚀 В работе</option>
                <option value="done">✅ Выполнено</option>
              </select>
            </div>

            {/* Фильтр по исполнителю */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Исполнитель
              </label>
              <select
                value={filters.assignee}
                onChange={(e) => handleFilterChange('assignee', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Все исполнители</option>
                <option value="Иван Иванов">Иван Иванов</option>
                <option value="Петр Петров">Петр Петров</option>
                <option value="Мария Сидорова">Мария Сидорова</option>
                <option value="Не назначен">Не назначен</option>
              </select>
            </div>
          </div>

          {/* Активные фильтры */}
          {hasActiveFilters && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-medium text-gray-700 mb-2">Активные фильтры:</h4>
              <div className="flex flex-wrap gap-2">
                {searchQuery && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                    Поиск: "{searchQuery}"
                  </span>
                )}
                {filters.priority !== 'all' && (
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
                    Приоритет: {filters.priority === 'high' ? 'Высокий' : filters.priority === 'medium' ? 'Средний' : 'Низкий'}
                  </span>
                )}
                {filters.status !== 'all' && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                    Статус: {filters.status === 'todo' ? 'К выполнению' : filters.status === 'inprogress' ? 'В работе' : 'Выполнено'}
                  </span>
                )}
                {filters.assignee !== 'all' && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                    Исполнитель: {filters.assignee}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}