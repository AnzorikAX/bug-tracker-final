import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../hooks/useAuth';
import { NotificationsProvider } from '../hooks/useNotifications';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bug Tracker - Система отслеживания ошибок',
  description: 'Профессиональная система для управления задачами и ошибками',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <AuthProvider>
          <NotificationsProvider>
            {children}
          </NotificationsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}