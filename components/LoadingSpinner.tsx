'use client';

// Пропсы для компонента загрузки
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'; // Размер спиннера
  text?: string; // Текст под спиннером
  overlay?: boolean; // Показывать ли overlay
}

// Компонент красивого индикатора загрузки
export default function LoadingSpinner({ 
  size = 'md', 
  text = 'Загрузка...', 
  overlay = false 
}: LoadingSpinnerProps) {
  // Размеры спиннера в зависимости от пропса size
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  };

  // Компонент спиннера
  const spinner = (
    <div className="flex flex-col items-center justify-center">
      {/* Анимированный спиннер */}
      <div className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin`}></div>
      {/* Текст под спиннером */}
      {text && (
        <p className="mt-2 text-sm text-gray-600 font-medium">{text}</p>
      )}
    </div>
  );

  // Если нужен overlay, оборачиваем спиннер в overlay
  if (overlay) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}