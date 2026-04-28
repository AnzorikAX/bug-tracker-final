import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

type EmailType =
  | 'task-created'
  | 'task-updated'
  | 'task-completed'
  | 'deadline-soon'
  | 'task-overdue'
  | 'test';

interface EmailData {
  taskId?: string;
  taskTitle?: string;
  taskDescription?: string;
  oldStatus?: string;
  newStatus?: string;
  oldPriority?: string;
  newPriority?: string;
  oldAssignee?: string;
  newAssignee?: string;
  deadline?: string;
  updatedBy?: string;
  appUrl?: string;
  [key: string]: string | undefined;
}

interface EmailRequest {
  to: string;
  subject?: string;
  type: EmailType;
  data: EmailData;
}

function getSubject(type: EmailType, data: EmailData): string {
  const title = data.taskTitle || 'Без названия';

  switch (type) {
    case 'task-created':
      return `Новая задача: ${title}`;
    case 'task-updated':
      return `Задача обновлена: ${title}`;
    case 'task-completed':
      return `Задача выполнена: ${title}`;
    case 'deadline-soon':
      return `Скоро дедлайн: ${title}`;
    case 'task-overdue':
      return `Просроченная задача: ${title}`;
    default:
      return 'Тестовое письмо Bug Tracker';
  }
}

function getHtml(type: EmailType, data: EmailData): string {
  const appUrl = data.appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const bodyByType: Record<EmailType, string> = {
    'task-created': `<p>Назначена новая задача: <strong>${data.taskTitle || 'Без названия'}</strong>.</p>`,
    'task-updated': `<p>Задача обновлена: <strong>${data.taskTitle || 'Без названия'}</strong>.</p>`,
    'task-completed': `<p>Задача завершена: <strong>${data.taskTitle || 'Без названия'}</strong>.</p>`,
    'deadline-soon': `<p>До дедлайна задачи <strong>${data.taskTitle || 'Без названия'}</strong> осталось мало времени.</p>`,
    'task-overdue': `<p>Задача <strong>${data.taskTitle || 'Без названия'}</strong> просрочена.</p>`,
    test: '<p>Это тестовое уведомление Bug Tracker.</p>',
  };

  return `
    <!doctype html>
    <html lang="ru">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Bug Tracker</title>
      </head>
      <body style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
        <h2 style="margin-bottom: 12px;">Bug Tracker</h2>
        ${bodyByType[type]}
        ${data.taskDescription ? `<p>${data.taskDescription}</p>` : ''}
        <p style="margin-top: 20px;">
          <a href="${appUrl}" style="color: #2563eb;">Открыть Bug Tracker</a>
        </p>
      </body>
    </html>
  `;
}

function getText(type: EmailType, data: EmailData): string {
  const title = data.taskTitle || 'Без названия';
  return `[${type}] ${title}\n${data.taskDescription || ''}`;
}

export async function POST(request: NextRequest) {
  const emailEnabled = process.env.EMAIL_ENABLED === 'true' || process.env.NEXT_PUBLIC_EMAIL_ENABLED === 'true';

  if (!emailEnabled) {
    return NextResponse.json({ message: 'Email system is disabled', sent: false }, { status: 200 });
  }

  try {
    const body = (await request.json()) as EmailRequest;
    const { to, type, data } = body;

    if (!to || !type) {
      return NextResponse.json({ error: 'Missing required fields: to, type' }, { status: 400 });
    }

    const smtpUser = process.env.EMAIL_SMTP_USER;
    const smtpPass = process.env.EMAIL_SMTP_PASS;
    const smtpHost = process.env.EMAIL_SMTP_HOST || 'smtp.ethereal.email';
    const smtpPort = Number(process.env.EMAIL_SMTP_PORT || '587');
    const smtpSecure = process.env.EMAIL_SMTP_SECURE === 'true';

    if (!smtpUser || !smtpPass) {
      return NextResponse.json({ error: 'Email credentials are not configured' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.verify();

    const subject = body.subject || getSubject(type, data || {});
    const html = getHtml(type, data || {});
    const text = getText(type, data || {});

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Bug Tracker" <noreply@bugtracker.com>',
      to,
      subject,
      html,
      text,
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      type,
      sentTo: to,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: 'Failed to send email',
        details: message,
        stack: process.env.NODE_ENV === 'development' ? stack : undefined,
      },
      { status: 500 }
    );
  }
}
