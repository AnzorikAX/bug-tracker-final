import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "../hooks/useAuth";
import { NotificationsProvider } from "../hooks/useNotifications";
import { ToastProvider } from "../components/ToastProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bug Tracker",
  description: "Система отслеживания ошибок и задач",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <NotificationsProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </NotificationsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}