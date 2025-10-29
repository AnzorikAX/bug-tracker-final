'use client';

// Пропсы для модального окна подтверждения
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info'; // Тип подтверждения для разных стилей
}

// Компонент модального окна подтверждения действий
export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  type = 'info'
}: ConfirmationModalProps) {
  // Стили для кнопки подтверждения в зависимости от типа
  const getConfirmButtonStyle = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 focus:ring-red-500';
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500';
      case 'info':
        return 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500';
      default:
        return 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500';
    }
  };

  // Иконка в зависимости от типа подтверждения
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return '🔴';
      case 'warning':
        return '🟡';
      case 'info':
        return '🔵';
      default:
        return 'ℹ️';
    }
  };

  // Обработчик подтверждения
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Заголовок модального окна */}
        <div className="flex items-center p-6 border-b">
          <div className="text-2xl mr-3">{getIcon()}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{message}</p>
          </div>
        </div>

        {/* Тело модального окна */}
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700 text-center">
              Это действие нельзя отменить
            </p>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex justify-end space-x-3 p-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${getConfirmButtonStyle()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}