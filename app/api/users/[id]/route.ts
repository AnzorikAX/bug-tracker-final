import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-response';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const user = await db.get(
      `
      SELECT id, email, name, role, createdAt, updatedAt
      FROM users
      WHERE id = ?
    `,
      [id]
    );

    if (!user) {
      return Response.json(errorResponse('User not found'), { status: 404 });
    }

    return Response.json(successResponse(user));
  } catch (error) {
    console.error('API: Error fetching user:', error);
    return Response.json(errorResponse('Failed to fetch user'), { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const updateData = await request.json();

    const fields: string[] = [];
    const values: unknown[] = [];

    if (updateData.email !== undefined) {
      fields.push('email = ?');
      values.push(updateData.email);
    }
    if (updateData.name !== undefined) {
      fields.push('name = ?');
      values.push(updateData.name);
    }
    if (updateData.role !== undefined) {
      fields.push('role = ?');
      values.push(updateData.role);
    }
    if (updateData.password !== undefined) {
      fields.push('password = ?');
      values.push(updateData.password);
    }

    fields.push('updatedAt = ?');
    values.push(new Date().toISOString());

    if (fields.length === 0) {
      return Response.json(errorResponse('No fields to update'), { status: 400 });
    }

    values.push(id);

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    await db.run(query, values as string[]);

    return Response.json(successResponse(null, 'User updated successfully'));
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return Response.json(errorResponse('User with this email already exists'), { status: 400 });
    }

    console.error('API: Error updating user:', error);
    return Response.json(errorResponse('Failed to update user'), { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await db.run('DELETE FROM users WHERE id = ?', [id]);

    return Response.json(successResponse(null, 'User deleted successfully'));
  } catch (error) {
    console.error('API: Error deleting user:', error);
    return Response.json(errorResponse('Failed to delete user'), { status: 500 });
  }
}
