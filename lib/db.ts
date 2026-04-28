import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbFile = process.env.DB_PATH || 'bugtracker.db';
const dbPath = path.isAbsolute(dbFile) ? dbFile : path.join(process.cwd(), dbFile);

class Database {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database at:', dbPath);
        this.init();
      }
    });
  }

  private async init() {
    await this.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'todo',
        priority TEXT DEFAULT 'medium',
        assignee TEXT,
        reporter TEXT,
        dueDate DATETIME,
        tags TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.run(`
      CREATE TABLE IF NOT EXISTS task_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        taskId TEXT NOT NULL,
        author TEXT NOT NULL,
        body TEXT NOT NULL,
        kind TEXT DEFAULT 'user',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await this.insertDemoData();
  }

  private async insertDemoData() {
    const result: any = await this.get('SELECT COUNT(*) as count FROM users', []);

    if (result && result.count > 0) {
      console.log('Database already has users:', result.count);
      return;
    }

    console.log('Inserting demo data...');

    const demoPassword = 'password123';
    const hashedPassword = await bcrypt.hash(demoPassword, 12);

    const demoUsers = [
      {
        id: 'admin-1',
        email: 'admin@bugtracker.com',
        name: 'Главный Администратор',
        password: hashedPassword,
        role: 'admin'
      },
      {
        id: 'user-1',
        email: 'user@bugtracker.com',
        name: 'Тестовый Пользователь',
        password: hashedPassword,
        role: 'user'
      }
    ];

    for (const user of demoUsers) {
      await this.run(
        `INSERT INTO users (id, email, name, password, role)
         VALUES (?, ?, ?, ?, ?)`,
        [user.id, user.email, user.name, user.password, user.role]
      );
    }

    console.log('Demo users inserted with hashed passwords');

    const demoTasks = [
      {
        id: 'task-1',
        title: 'Починить систему аутентификации',
        description: 'Пользователи не могут войти в систему',
        status: 'in-progress',
        priority: 'high',
        assignee: 'admin-1',
        reporter: 'admin-1',
        tags: JSON.stringify(['auth', 'critical'])
      },
      {
        id: 'task-2',
        title: 'Добавить новые функции',
        description: 'Реализовать дополнительные возможности трекера',
        status: 'todo',
        priority: 'medium',
        assignee: 'user-1',
        reporter: 'admin-1',
        tags: JSON.stringify(['features', 'ui'])
      }
    ];

    for (const task of demoTasks) {
      await this.run(
        `INSERT INTO tasks (id, title, description, status, priority, assignee, reporter, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [task.id, task.title, task.description, task.status, task.priority, task.assignee, task.reporter, task.tags]
      );
    }

    console.log('Demo data inserted successfully');
    console.log('Для входа используйте:');
    console.log('  Админ: admin@bugtracker.com / password123');
    console.log('  Пользователь: user@bugtracker.com / password123');
  }

  run(sql: string, params: any[] = []): Promise<{ id?: number }> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  }

  get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row as T);
      });
    });
  }

  all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as T[]);
      });
    });
  }
}

const db = new Database();
export { db };
