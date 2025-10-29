import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API: Fetching tasks from database...');
    
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const assignee = searchParams.get('assignee');

    let query = `
      SELECT 
        t.*,
        u1.name as assigneeName,
        u2.name as reporterName
      FROM tasks t
      LEFT JOIN users u1 ON t.assignee = u1.id
      LEFT JOIN users u2 ON t.reporter = u2.id
    `;
    const params: any[] = [];

    if (status) {
      query += ' WHERE t.status = ?';
      params.push(status);
    }

    if (assignee) {
      query += params.length ? ' AND t.assignee = ?' : ' WHERE t.assignee = ?';
      params.push(assignee);
    }

    query += ' ORDER BY t.createdAt DESC';

    const tasks = await db.all(query, params);
    console.log(`✅ API: Found ${tasks.length} tasks in database`);

    // Parse JSON tags and ensure proper data types
    const tasksWithParsedTags = tasks.map((task: any) => ({
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : [],
      dueDate: task.dueDate || null
    }));

    return Response.json(successResponse(tasksWithParsedTags));
  } catch (error) {
    console.error('❌ API: Error fetching tasks:', error);
    return Response.json(errorResponse('Failed to fetch tasks'), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const taskData = await request.json();
    console.log('🚀 API: Creating task:', taskData);

    // Validate required fields
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
      reporter: taskData.assignee, // For now, use assignee as reporter
      dueDate: taskData.dueDate || null,
      tags: taskData.tags ? JSON.stringify(taskData.tags) : '[]',
      createdAt: now,
      updatedAt: now
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
        newTask.updatedAt
      ]
    );

    console.log('✅ API: Task created successfully:', taskId);
    
    // Return the complete task data
    return Response.json(successResponse({
  ...newTask,
  id: taskId,
  tags: JSON.parse(newTask.tags)
}, 'Task created successfully'), { status: 201 });
  } catch (error) {
    console.error('❌ API: Error creating task:', error);
    return Response.json(errorResponse('Failed to create task'), { status: 500 });
  }
}