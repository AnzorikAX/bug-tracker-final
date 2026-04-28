'use client';

import { AuthProvider } from '../hooks/useAuth';
import { NotificationsProvider } from '../hooks/useNotifications';
import { ToastProvider } from './ToastProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <ToastProvider>{children}</ToastProvider>
      </NotificationsProvider>
    </AuthProvider>
  );
}
