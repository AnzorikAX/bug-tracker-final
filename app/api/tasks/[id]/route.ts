import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-response';

// 🔥 ИСПРАВЛЕНИЕ: Параметры теперь Promise
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params; // ← ДОБАВИТЬ await
    console.log('🔍 API: Fetching task:', id);
    
    const task = await db.get(`
      SELECT 
        t.*,
        u1.name as assigneeName,
        u2.name as reporterName
      FROM tasks t
      LEFT JOIN users u1 ON t.assignee = u1.id
      LEFT JOIN users u2 ON t.reporter = u2.id
      WHERE t.id = ?
    `, [id]); // ← ИСПОЛЬЗОВАТЬ id

    if (!task) {
      return Response.json(errorResponse('Task not found'), { status: 404 });
    }

    // Parse JSON tags
    const taskWithParsedTags = {
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : [],
      dueDate: task.dueDate || null
    };

    return Response.json(successResponse(taskWithParsedTags));
  } catch (error) {
    console.error('❌ API: Error fetching task:', error);
    return Response.json(errorResponse('Failed to fetch task'), { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params; // ← ДОБАВИТЬ await
    const updateData = await request.json();
    console.log('✏️ API: Updating task:', id, updateData);

    // Build dynamic update query
    const fields: string[] = [];
    const values: any[] = [];

    if (updateData.title !== undefined) {
      fields.push('title = ?');
      values.push(updateData.title);
    }
    if (updateData.description !== undefined) {
      fields.push('description = ?');
      values.push(updateData.description);
    }
    if (updateData.status !== undefined) {
      fields.push('status = ?');
      values.push(updateData.status);
    }
    if (updateData.priority !== undefined) {
      fields.push('priority = ?');
      values.push(updateData.priority);
    }
    if (updateData.assignee !== undefined) {
      fields.push('assignee = ?');
      values.push(updateData.assignee);
    }
    if (updateData.dueDate !== undefined) {
      fields.push('dueDate = ?');
      values.push(updateData.dueDate);
    }
    if (updateData.tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(updateData.tags));
    }

    // Always update the updatedAt timestamp
    fields.push('updatedAt = ?');
    values.push(new Date().toISOString());

    if (fields.length === 0) {
      return Response.json(errorResponse('No fields to update'), { status: 400 });
    }

    values.push(id); // ← ИСПОЛЬЗОВАТЬ id

    const query = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;
    await db.run(query, values);

    console.log('✅ API: Task updated successfully:', id); // ← ИСПОЛЬЗОВАТЬ id
    return Response.json(successResponse(null, 'Task updated successfully'));
  } catch (error) {
    console.error('❌ API: Error updating task:', error);
    return Response.json(errorResponse('Failed to update task'), { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params; // ← ДОБАВИТЬ await
    console.log('🗑️ API: Deleting task:', id); // ← ИСПОЛЬЗОВАТЬ id
    
    await db.run('DELETE FROM tasks WHERE id = ?', [id]); // ← ИСПОЛЬЗОВАТЬ id

    console.log('✅ API: Task deleted successfully:', id); // ← ИСПОЛЬЗОВАТЬ id
    return Response.json(successResponse(null, 'Task deleted successfully'));
  } catch (error) {
    console.error('❌ API: Error deleting task:', error);
    return Response.json(errorResponse('Failed to delete task'), { status: 500 });
  }
}