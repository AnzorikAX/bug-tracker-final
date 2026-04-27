import nodemailer from 'nodemailer';

// 🔒 Feature flag - по умолчанию ВЫКЛЮЧЕНО для безопасности
const EMAIL_ENABLED = process.env.NEXT_PUBLIC_EMAIL_ENABLED === 'true';

// 🔒 Создаем тестовый транспортер (Ethereal)
const createTestTransporter = async () => {
  try {
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('📧 Ethereal тестовый аккаунт создан:');
    console.log('   Email для просмотра:', testAccount.user);
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    return transporter;
  } catch (error) {
    console.error('❌ Не удалось создать тестовый email аккаунт:', error);
    return null;
  }
};

// 🔒 Глобальный транспортер
let transporter: nodemailer.Transporter | null = null;

// 🔒 Получение транспортера (ленивая инициализация)
const getTransporter = async (): Promise<nodemailer.Transporter | null> => {
  if (!EMAIL_ENABLED) return null;
  
  if (!transporter) {
    transporter = await createTestTransporter();
  }
  return transporter;
};

// 📧 Отправка уведомления о новой задаче
export async function sendTaskAssignedEmail(
  task: {
    id: number;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    assignee: string;
    deadline?: Date | null;
    createdBy?: string;
  },
  assigneeEmail: string
): Promise<{ success: boolean; previewUrl?: string; error?: string }> {
  
  // Проверяем feature flag
  if (!EMAIL_ENABLED) {
    console.log('[EMAIL SIMULATION] Уведомление о задаче назначена:', {
      task: task.title,
      to: assigneeEmail,
      assignee: task.assignee
    });
    return { success: true };
  }

  try {
    const mailTransporter = await getTransporter();
    
    if (!mailTransporter) {
      console.log('📧 Email отключен или транспортер не инициализирован');
      return { success: false, error: 'Email service not available' };
    }

    // 📝 Настройки письма
    const priorityInfo = {
      high: { color: '#dc2626', text: '🔴 Высокий', emoji: '🚨' },
      medium: { color: '#d97706', text: '🟡 Средний', emoji: '⚠️' },
      low: { color: '#059669', text: '🟢 Низкий', emoji: '✅' }
    };

    const priority = priorityInfo[task.priority];

    // 📧 HTML шаблон
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 25px; border: 1px solid #e5e7eb; }
          .task-card { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${priority.color}; margin: 20px 0; }
          .priority { display: inline-block; padding: 5px 10px; border-radius: 4px; font-weight: bold; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
          .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0;">${priority.emoji} Новая задача назначена</h1>
        </div>
        
        <div class="content">
          <p>Здравствуйте, <strong>${task.assignee}</strong>!</p>
          <p>Вам назначена новая задача в системе Bug Tracker.</p>
          
          <div class="task-card">
            <h2 style="margin-top: 0;">${task.title}</h2>
            <p>${task.description}</p>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0;">
              <div>
                <strong>Приоритет:</strong><br>
                <span class="priority" style="color: ${priority.color}">
                  ${priority.text}
                </span>
              </div>
              <div>
                <strong>ID задачи:</strong><br>
                #${task.id}
              </div>
            </div>
            
            ${task.deadline ? `
              <div style="background: #fef3c7; padding: 10px; border-radius: 6px; margin: 15px 0;">
                <strong>📅 Дедлайн:</strong><br>
                ${new Date(task.deadline).toLocaleDateString('ru-RU', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            ` : ''}
          </div>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" class="btn">
            Перейти в Bug Tracker →
          </a>
        </div>
        
        <div class="footer">
          <p>Это автоматическое уведомление от системы Bug Tracker.</p>
          <p>Если вы не хотите получать такие уведомления, свяжитесь с администратором.</p>
          <p>📍 ${new Date().toLocaleDateString('ru-RU')}</p>
        </div>
      </body>
      </html>
    `;

    // 📤 Настройки отправки
    const mailOptions = {
      from: '"Bug Tracker" <notifications@bugtracker.app>',
      to: assigneeEmail,
      subject: `${priority.emoji} Новая задача: ${task.title}`,
      html: htmlContent,
      text: `Новая задача #${task.id}: ${task.title}\n\nОписание: ${task.description}\n\nПриоритет: ${priority.text}\nИсполнитель: ${task.assignee}\n\n---\nBug Tracker Notification\n${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`
    };

    // Отправляем письмо
    const info = await mailTransporter.sendMail(mailOptions);
    
    console.log('✅ Email отправлен успешно!');
    console.log('   📧 Message ID:', info.messageId);
    console.log('   👀 Предпросмотр:', nodemailer.getTestMessageUrl(info));
    
    return { 
      success: true, 
      previewUrl: nodemailer.getTestMessageUrl(info) 
    };
    
  } catch (error) {
    console.error('❌ Ошибка отправки email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// 🧪 Тестовая функция
export async function testEmailConnection() {
  console.log('🧪 Тестируем соединение с email сервисом...');
  
  const testTask = {
    id: 999,
    title: "Тестовая задача для проверки email",
    description: "Это тестовое уведомление проверяет работу email системы",
    priority: "medium" as const,
    assignee: "Тестовый Пользователь",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  };
  
  const result = await sendTaskAssignedEmail(testTask, 'test-recipient@ethereal.email');
  
  if (result.success && result.previewUrl) {
    console.log('🎉 Тест пройден!');
    console.log('   👀 Перейдите по ссылке для просмотра письма:', result.previewUrl);
    return { ...result, instruction: 'Откройте ссылку выше в браузере для просмотра тестового письма' };
  } else {
    console.log('❌ Тест не пройден:', result.error);
    return result;
  }
}