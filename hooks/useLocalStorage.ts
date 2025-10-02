'use client';

import { useState, useEffect } from 'react'; // Должен быть useEffect

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Инициализация при первом рендере
  useEffect(() => { // Здесь тоже useEffect
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.log(`Ошибка чтения из LocalStorage (${key}):`, error);
    } finally {
      setIsFirstLoad(false);
    }
  }, [key]);

  // Обертка для setStoredValue, которая также сохраняет в LocalStorage
  const setValue = (value: T | ((val: T) => T)) => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // Разрешаем value быть функцией, как useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Сохраняем в состояние
      setStoredValue(valueToStore);
      
      // Сохраняем в LocalStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(`Ошибка записи в LocalStorage (${key}):`, error);
    }
  };

  return [storedValue, setValue, isFirstLoad] as const;
}