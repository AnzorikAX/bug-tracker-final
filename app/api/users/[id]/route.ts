import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/api-response';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    console.log('🔍 API: Fetching user:', params.id);
    
    const user = await db.get(`
      SELECT id, email, name, role, createdAt, updatedAt 
      FROM users 
      WHERE id = ?
    `, [params.id]);

    if (!user) {
      return Response.json(errorResponse('User not found'), { status: 404 });
    }

    return Response.json(successResponse(user));
  } catch (error) {
    console.error('❌ API: Error fetching user:', error);
    return Response.json(errorResponse('Failed to fetch user'), { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const updateData = await request.json();
    console.log('✏️ API: Updating user:', params.id, updateData);

    // Build dynamic update query
    const fields: string[] = [];
    const values: any[] = [];

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

    // Always update the updatedAt timestamp
    fields.push('updatedAt = ?');
    values.push(new Date().toISOString());

    if (fields.length === 0) {
      return Response.json(errorResponse('No fields to update'), { status: 400 });
    }

    values.push(params.id);

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    await db.run(query, values);

    console.log('✅ API: User updated successfully:', params.id);
    return Response.json(successResponse(null, 'User updated successfully'));
  } catch (error: any) {
    console.error('❌ API: Error updating user:', error);
    
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return Response.json(errorResponse('User with this email already exists'), { status: 400 });
    }
    
    return Response.json(errorResponse('Failed to update user'), { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    console.log('🗑️ API: Deleting user:', params.id);
    
    await db.run('DELETE FROM users WHERE id = ?', [params.id]);

    console.log('✅ API: User deleted successfully:', params.id);
    return Response.json(successResponse(null, 'User deleted successfully'));
  } catch (error) {
    console.error('❌ API: Error deleting user:', error);
    return Response.json(errorResponse('Failed to delete user'), { status: 500 });
  }
}