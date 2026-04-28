import nodemailer from 'nodemailer';

type MailResult = {
  success: boolean;
  skipped?: boolean;
  reason?: string;
  messageId?: string;
};

type AssigneeNotificationPayload = {
  to: string;
  assigneeName: string;
  taskTitle: string;
  taskDescription?: string;
  taskId: string;
  dueDate?: string | null;
  appUrl?: string;
};

let cachedTransporter: nodemailer.Transporter | null = null;

function isEmailEnabled(): boolean {
  return process.env.EMAIL_ENABLED === 'true';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDueDate(dueDate?: string | null): string {
  if (!dueDate) return 'Не установлен';
  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) return 'Не установлен';
  return parsed.toLocaleDateString('ru-RU');
}

function getTransporter(): nodemailer.Transporter {
  if (cachedTransporter) return cachedTransporter;

  const smtpHost = process.env.EMAIL_SMTP_HOST;
  const smtpPort = Number(process.env.EMAIL_SMTP_PORT || '587');
  const smtpSecure = process.env.EMAIL_SMTP_SECURE === 'true';
  const smtpUser = process.env.EMAIL_SMTP_USER;
  const smtpPass = process.env.EMAIL_SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('SMTP credentials are not fully configured');
  }

  cachedTransporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    connectionTimeout: 15000,
    socketTimeout: 15000,
    greetingTimeout: 15000,
  });

  return cachedTransporter;
}

export async function sendTaskAssignedNotification(payload: AssigneeNotificationPayload): Promise<MailResult> {
  if (!isEmailEnabled()) {
    return { success: true, skipped: true, reason: 'email_disabled' };
  }

  try {
    const transporter = getTransporter();
    const appUrl = payload.appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const from = process.env.EMAIL_FROM || '"Bug Tracker" <noreply@bugtracker.com>';

    const safeTitle = escapeHtml(payload.taskTitle);
    const safeDescription = escapeHtml(payload.taskDescription || 'Описание не указано');
    const safeAssignee = escapeHtml(payload.assigneeName);
    const safeTaskId = escapeHtml(payload.taskId);
    const safeDueDate = escapeHtml(formatDueDate(payload.dueDate));

    const html = `
      <div style="font-family: Arial, sans-serif; color: #1f2937; max-width: 620px; margin: 0 auto;">
        <h2 style="margin: 0 0 12px;">На вас назначена задача</h2>
        <p>Здравствуйте, <strong>${safeAssignee}</strong>!</p>
        <p>В Bug Tracker на вас назначена новая задача.</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px;">
          <p style="margin: 0 0 8px;"><strong>Задача:</strong> ${safeTitle}</p>
          <p style="margin: 0 0 8px;"><strong>ID:</strong> ${safeTaskId}</p>
          <p style="margin: 0 0 8px;"><strong>Дедлайн:</strong> ${safeDueDate}</p>
          <p style="margin: 0;"><strong>Описание:</strong> ${safeDescription}</p>
        </div>
        <p style="margin-top: 16px;">
          <a href="${appUrl}" style="color: #2563eb;">Открыть Bug Tracker</a>
        </p>
      </div>
    `;

    const text = [
      'На вас назначена задача',
      `Исполнитель: ${payload.assigneeName}`,
      `Задача: ${payload.taskTitle}`,
      `ID: ${payload.taskId}`,
      `Дедлайн: ${formatDueDate(payload.dueDate)}`,
      `Описание: ${payload.taskDescription || 'Описание не указано'}`,
      `Ссылка: ${appUrl}`,
    ].join('\n');

    const info = await transporter.sendMail({
      from,
      to: payload.to,
      subject: `На вас назначена задача: ${payload.taskTitle}`,
      html,
      text,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown_error';
    console.error('Email notification failed:', reason);
    return { success: false, reason };
  }
}

