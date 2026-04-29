import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-response';
import { sendTaskAssignedNotification } from '@/lib/transactional-email';

type DbTask = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  reporter: string;
  dueDate: string | null;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
  discussionCount: number;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const assignee = searchParams.get('assignee');

    let query = `
      SELECT
        t.*,
        u1.name as assigneeName,
        u2.name as reporterName,
        COALESCE(tm.userMessageCount, 0) as discussionCount
      FROM tasks t
      LEFT JOIN users u1 ON t.assignee = u1.id
      LEFT JOIN users u2 ON t.reporter = u2.id
      LEFT JOIN (
        SELECT taskId, COUNT(*) as userMessageCount
        FROM task_messages
        WHERE kind = 'user'
        GROUP BY taskId
      ) tm ON tm.taskId = t.id
    `;
    const params: string[] = [];

    if (status) {
      query += ' WHERE t.status = ?';
      params.push(status);
    }

    if (assignee) {
      query += params.length ? ' AND t.assignee = ?' : ' WHERE t.assignee = ?';
      params.push(assignee);
    }

    query += ' ORDER BY t.createdAt DESC';

    const tasks = await db.all<DbTask>(query, params);

    const tasksWithParsedTags = tasks.map((task) => ({
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : [],
      dueDate: task.dueDate || null,
    }));

    return Response.json(successResponse(tasksWithParsedTags));
  } catch (error) {
    console.error('API: Error fetching tasks:', error);
    return Response.json(errorResponse('Failed to fetch tasks'), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const taskData = await request.json();

    if (!taskData.title || !taskData.assignee) {
      return Response.json(errorResponse('Title and assignee are required'), { status: 400 });
    }

    const taskId = `task-${Date.now()}`;
    const now = new Date().toISOString();

    const newTask = {
      id: taskId,
      title: taskData.title,
      description: taskData.description || '',
      status: 'todo',
      priority: taskData.priority || 'medium',
      assignee: taskData.assignee,
      reporter: taskData.assignee,
      dueDate: taskData.dueDate || null,
      tags: taskData.tags ? JSON.stringify(taskData.tags) : '[]',
      createdAt: now,
      updatedAt: now,
    };

    await db.run(
      `INSERT INTO tasks (id, title, description, status, priority, assignee, reporter, dueDate, tags, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newTask.id,
        newTask.title,
        newTask.description,
        newTask.status,
        newTask.priority,
        newTask.assignee,
        newTask.reporter,
        newTask.dueDate,
        newTask.tags,
        newTask.createdAt,
        newTask.updatedAt,
      ]
    );

    const assigneeUser = await db.get<{ id: string; email: string; name: string }>(
      'SELECT id, email, name FROM users WHERE id = ? OR email = ? OR name = ? LIMIT 1',
      [newTask.assignee, newTask.assignee, newTask.assignee]
    );

    if (assigneeUser?.email) {
      const emailResult = await sendTaskAssignedNotification({
        to: assigneeUser.email,
        assigneeName: assigneeUser.name || newTask.assignee,
        taskTitle: newTask.title,
        taskDescription: newTask.description,
        taskId: newTask.id,
        dueDate: newTask.dueDate,
      });

      if (!emailResult.success && !emailResult.skipped) {
        console.error('API: Assignment email failed for new task', newTask.id, emailResult.reason);
      }
    } else {
      console.warn('API: Assignment email skipped, assignee email not found for task', newTask.id);
    }

    return Response.json(
      successResponse(
        {
          ...newTask,
          id: taskId,
          tags: JSON.parse(newTask.tags),
        },
        'Task created successfully'
      ),
      { status: 201 }
    );
  } catch (error) {
    console.error('API: Error creating task:', error);
    return Response.json(errorResponse('Failed to create task'), { status: 500 });
  }
}
