import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/api-response';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

type MessageRow = {
  id: number;
  taskId: string;
  author: string;
  body: string;
  kind: 'user' | 'system';
  createdAt: string;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const taskExists = await db.get<{ id: string }>('SELECT id FROM tasks WHERE id = ? LIMIT 1', [id]);
    if (!taskExists) {
      return Response.json(errorResponse('Task not found'), { status: 404 });
    }

    const messages = await db.all<MessageRow>(
      `SELECT id, taskId, author, body, kind, createdAt
       FROM task_messages
       WHERE taskId = ?
       ORDER BY createdAt ASC, id ASC`,
      [id]
    );

    return Response.json(successResponse(messages));
  } catch (error) {
    console.error('API: Error fetching task messages:', error);
    return Response.json(errorResponse('Failed to fetch task messages'), { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const payload = await request.json();

    if (!payload?.author || !payload?.body) {
      return Response.json(errorResponse('Author and body are required'), { status: 400 });
    }

    const taskExists = await db.get<{ id: string }>('SELECT id FROM tasks WHERE id = ? LIMIT 1', [id]);
    if (!taskExists) {
      return Response.json(errorResponse('Task not found'), { status: 404 });
    }

    const createdAt = new Date().toISOString();
    const kind = payload.kind === 'system' ? 'system' : 'user';

    const result = await db.run(
      `INSERT INTO task_messages (taskId, author, body, kind, createdAt)
       VALUES (?, ?, ?, ?, ?)`,
      [id, String(payload.author), String(payload.body), kind, createdAt]
    );

    const message = {
      id: result.id,
      taskId: id,
      author: String(payload.author),
      body: String(payload.body),
      kind,
      createdAt,
    };

    return Response.json(successResponse(message, 'Message created successfully'), { status: 201 });
  } catch (error) {
    console.error('API: Error creating task message:', error);
    return Response.json(errorResponse('Failed to create task message'), { status: 500 });
  }
}
