'use client';

import { AuthProvider } from '../hooks/useAuth';
import { NotificationsProvider } from '../hooks/useNotifications';
import ToastProvider from './ToastProvider';

// Этот компонент оборачивает все провайдеры и должен использоваться в layout.tsx
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </NotificationsProvider>
    </AuthProvider>
  );
}