import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-response';
import { sendTaskAssignedNotification } from '@/lib/transactional-email';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

type TaskRow = {
  id: string;
  title: string;
  description: string;
  assignee: string;
  dueDate: string | null;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const task = await db.get(
      `
      SELECT
        t.*,
        u1.name as assigneeName,
        u2.name as reporterName
      FROM tasks t
      LEFT JOIN users u1 ON t.assignee = u1.id
      LEFT JOIN users u2 ON t.reporter = u2.id
      WHERE t.id = ?
    `,
      [id]
    );

    if (!task) {
      return Response.json(errorResponse('Task not found'), { status: 404 });
    }

    const taskWithParsedTags = {
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : [],
      dueDate: task.dueDate || null,
    };

    return Response.json(successResponse(taskWithParsedTags));
  } catch (error) {
    console.error('API: Error fetching task:', error);
    return Response.json(errorResponse('Failed to fetch task'), { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const updateData = await request.json();

    const existingTask = await db.get<TaskRow>('SELECT id, title, description, assignee, dueDate FROM tasks WHERE id = ?', [id]);
    if (!existingTask) {
      return Response.json(errorResponse('Task not found'), { status: 404 });
    }

    const fields: string[] = [];
    const values: unknown[] = [];

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

    fields.push('updatedAt = ?');
    values.push(new Date().toISOString());

    if (fields.length === 0) {
      return Response.json(errorResponse('No fields to update'), { status: 400 });
    }

    values.push(id);
    const query = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;
    await db.run(query, values as string[]);

    const assigneeChanged =
      updateData.assignee !== undefined &&
      typeof updateData.assignee === 'string' &&
      updateData.assignee !== existingTask.assignee;

    if (assigneeChanged) {
      const assigneeUser = await db.get<{ id: string; email: string; name: string }>(
        'SELECT id, email, name FROM users WHERE id = ? OR email = ? OR name = ? LIMIT 1',
        [updateData.assignee, updateData.assignee, updateData.assignee]
      );

      if (assigneeUser?.email) {
        const emailResult = await sendTaskAssignedNotification({
          to: assigneeUser.email,
          assigneeName: assigneeUser.name || updateData.assignee,
          taskTitle: updateData.title || existingTask.title,
          taskDescription: updateData.description || existingTask.description,
          taskId: id,
          dueDate: updateData.dueDate !== undefined ? updateData.dueDate : existingTask.dueDate,
        });

        if (!emailResult.success && !emailResult.skipped) {
          console.error('API: Assignment email failed for updated task', id, emailResult.reason);
        }
      } else {
        console.warn('API: Assignment email skipped, assignee email not found for task', id);
      }
    }

    return Response.json(successResponse(null, 'Task updated successfully'));
  } catch (error) {
    console.error('API: Error updating task:', error);
    return Response.json(errorResponse('Failed to update task'), { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await db.run('DELETE FROM tasks WHERE id = ?', [id]);

    return Response.json(successResponse(null, 'Task deleted successfully'));
  } catch (error) {
    console.error('API: Error deleting task:', error);
    return Response.json(errorResponse('Failed to delete task'), { status: 500 });
  }
}
