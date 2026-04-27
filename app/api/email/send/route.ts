// app/api/email/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Типы email уведомлений
type EmailType = 
  | 'task-created'       // Новая задача
  | 'task-updated'       // Обновление задачи
  | 'task-completed'     // Задача выполнена
  | 'deadline-soon'      // Скоро дедлайн (24 часа)
  | 'task-overdue'       // Просроченная задача
  | 'test'              // Тестовое письмо

interface EmailRequest {
  to: string;
  subject?: string;
  type: EmailType;
  data: {
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
    taskUrl?: string;
    [key: string]: any;
  };
}

// Генератор HTML шаблонов
const generateEmailHtml = (type: EmailType, data: any): string => {
  const appUrl = data.appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const taskUrl = data.taskId ? `${appUrl}/task/${data.taskId}` : appUrl;
  
  const baseStyles = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
      .button { display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
      .info-box { background: #e8f4fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; }
      .warning-box { background: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
      .task-card { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; }
      .changes-list { margin: 15px 0; }
      .change-item { margin: 8px 0; padding-left: 20px; position: relative; }
      .change-item:before { content: "•"; position: absolute; left: 0; color: #4f46e5; }
      .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px; }
    </style>
  `;

  const getSubject = (): string => {
    const subjects = {
      'task-created': `✅ Новая задача: ${data.taskTitle}`,
      'task-updated': `✏️ Задача обновлена: ${data.taskTitle}`,
      'task-completed': `🎉 Задача выполнена: ${data.taskTitle}`,
      'deadline-soon': `⏰ Скоро дедлайн: ${data.taskTitle}`,
      'task-overdue': `🚨 Просрочено: ${data.taskTitle}`,
      'test': 'Тестовое письмо из Bug Tracker'
    };
    return subjects[type] || 'Уведомление из Bug Tracker';
  };

  const getHeader = (): string => {
    const headers = {
      'task-created': '🎯 Новая задача назначена',
      'task-updated': '✏️ Задача была обновлена',
      'task-completed': '🎉 Задача выполнена!',
      'deadline-soon': '⏰ Внимание: скоро дедлайн',
      'task-overdue': '🚨 Задача просрочена!',
      'test': 'Тестирование системы уведомлений'
    };
    return headers[type] || 'Уведомление';
  };

  const getContent = (): string => {
    switch(type) {
      case 'task-created':
        return `
          <div class="info-box">
            <strong>📋 Задача:</strong> ${data.taskTitle}<br>
            <strong>👤 Исполнитель:</strong> ${data.newAssignee || 'Не назначен'}<br>
            ${data.deadline ? `<strong>📅 Дедлайн:</strong> ${new Date(data.deadline).toLocaleDateString('ru-RU')}<br>` : ''}
            ${data.taskDescription ? `<strong>📝 Описание:</strong><br>${data.taskDescription}<br>` : ''}
          </div>
          <p>Задача была создана ${data.updatedBy ? `пользователем <strong>${data.updatedBy}</strong>` : ''}</p>
        `;

      case 'task-updated':
        const changes = [];
        if (data.oldStatus !== data.newStatus) changes.push(`Статус: ${data.oldStatus} → ${data.newStatus}`);
        if (data.oldPriority !== data.newPriority) changes.push(`Приоритет: ${data.oldPriority} → ${data.newPriority}`);
        if (data.oldAssignee !== data.newAssignee) changes.push(`Исполнитель: ${data.oldAssignee} → ${data.newAssignee}`);
        
        return `
          <div class="task-card">
            <h3 style="margin-top: 0;">${data.taskTitle}</h3>
            ${changes.length > 0 ? `
              <div class="changes-list">
                <strong>Изменения:</strong>
                ${changes.map(change => `<div class="change-item">${change}</div>`).join('')}
              </div>
            ` : ''}
            ${data.deadline ? `<p><strong>📅 Дедлайн:</strong> ${new Date(data.deadline).toLocaleDateString('ru-RU')}</p>` : ''}
            <p>Обновлено ${data.updatedBy ? `пользователем <strong>${data.updatedBy}</strong>` : ''}</p>
          </div>
        `;

      case 'task-completed':
        return `
          <div class="info-box">
            <h3 style="margin-top: 0; color: #4caf50;">🎉 Поздравляем!</h3>
            <p>Задача <strong>"${data.taskTitle}"</strong> была успешно выполнена.</p>
            <p>Время выполнения: ${data.completionTime || 'отметка выполнена'}</p>
            ${data.updatedBy ? `<p>Отметил выполнение: <strong>${data.updatedBy}</strong></p>` : ''}
          </div>
        `;

      case 'deadline-soon':
        return `
          <div class="warning-box">
            <h3 style="margin-top: 0; color: #ff9800;">⏰ Внимание!</h3>
            <p>До дедлайна задачи <strong>"${data.taskTitle}"</strong> осталось менее 24 часов.</p>
            <p><strong>Дедлайн:</strong> ${new Date(data.deadline).toLocaleString('ru-RU')}</p>
            ${data.taskDescription ? `<p><strong>Описание:</strong> ${data.taskDescription.substring(0, 200)}...</p>` : ''}
          </div>
        `;

      case 'task-overdue':
        return `
          <div class="warning-box" style="border-left-color: #f44336;">
            <h3 style="margin-top: 0; color: #f44336;">🚨 Срочно!</h3>
            <p>Задача <strong>"${data.taskTitle}"</strong> просрочена!</p>
            <p><strong>Дедлайн был:</strong> ${new Date(data.deadline).toLocaleString('ru-RU')}</p>
            <p>Просрочка: ${data.overdueBy || 'более суток'}</p>
          </div>
        `;

      default:
        return `
          <div class="info-box">
            <p>Это тестовое письмо от системы Bug Tracker.</p>
            <p>Если вы получили это письмо, значит система уведомлений работает корректно.</p>
          </div>
        `;
    }
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${getSubject()}</title>
        ${baseStyles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Bug Tracker</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">${getHeader()}</p>
          </div>
          
          <div class="content">
            ${getContent()}
            
            ${data.taskId ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${taskUrl}" class="button">👉 Перейти к задаче</a>
              </div>
            ` : ''}
            
            <div class="footer">
              <p>Это автоматическое сообщение от системы Bug Tracker.</p>
              <p>Для изменения настроек уведомлений перейдите в <a href="${appUrl}/profile">профиль</a>.</p>
              <p style="font-size: 12px; color: #999;">ID сообщения: ${Date.now()}-${Math.random().toString(36).substr(2, 9)}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

export async function POST(request: NextRequest) {
  // Проверка feature flag
  if (process.env.NEXT_PUBLIC_EMAIL_ENABLED !== 'true') {
    return NextResponse.json(
      { message: 'Email system is disabled', sent: false },
      { status: 200 }
    );
  }

  try {
    const body: EmailRequest = await request.json();
    const { to, type, data } = body;

    if (!to || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: to, type' },
        { status: 400 }
      );
    }

    // Создаем транспорт для Ethereal
    const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: {
    user: 'gussie.wilkinson@ethereal.email', // ← РАБОЧИЙ email
    pass: 'G3Ea2pCy4w6zrjGUsP', // ← РАБОЧИЙ пароль
  },
});

    // Проверка подключения
    await transporter.verify();

    // Генерируем HTML контент
    const htmlContent = generateEmailHtml(type, {
      ...data,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    });

    // Отправляем письмо
    const info = await transporter.sendMail({
      from: '"Bug Tracker" <noreply@bugtracker.com>',
      to,
      subject: body.subject || generateEmailHtml(type, data).match(/<title>(.*?)<\/title>/)?.[1] || 'Bug Tracker Notification',
      html: htmlContent,
      text: `Bug Tracker Notification\n\nType: ${type}\n\nView at: ${process.env.NEXT_PUBLIC_APP_URL}`,
    });

    console.log(`📧 Email sent (${type}): ${info.messageId}`);
    console.log(`   Preview: https://ethereal.email/message/${info.messageId}`);

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      previewUrl: `https://ethereal.email/message/${info.messageId}`,
      type,
      sentTo: to
    });

  } catch (error: any) {
    console.error('❌ Email sending error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}