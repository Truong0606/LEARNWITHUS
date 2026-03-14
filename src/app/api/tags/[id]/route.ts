// GET /api/tags/[id] - Get tag by ID
// PUT /api/tags/[id] - Update tag
// DELETE /api/tags/[id] - Delete tag

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { Tag, ApiResponse } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// GET - Get tag by ID
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const tagDoc = await adminDb.collection(COLLECTIONS.tags).doc(id).get();

    if (!tagDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy tag', statusCode: 404 },
        { status: 404 }
      );
    }

    const tag = tagDoc.data() as Tag;

    return NextResponse.json<ApiResponse<Tag>>(
      { data: tag, message: 'Lấy thông tin tag thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// PUT - Update tag
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Unauthorized', statusCode: 401 },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Token không hợp lệ', statusCode: 401 },
        { status: 401 }
      );
    }

    // Only Staff, Manager, Admin can update tags
    if (!['Staff', 'Manager', 'Admin'].includes(payload.role)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền cập nhật tag', statusCode: 403 },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body: { name?: string } = await request.json();

    const tagDoc = await adminDb.collection(COLLECTIONS.tags).doc(id).get();

    if (!tagDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy tag', statusCode: 404 },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp()
    };

    if (body.name !== undefined) {
      const newSlug = generateSlug(body.name);
      
      // Check if new slug already exists (excluding current tag)
      const existingSnapshot = await adminDb
        .collection(COLLECTIONS.tags)
        .where('slug', '==', newSlug)
        .get();

      const existingOther = existingSnapshot.docs.find(doc => doc.id !== id);
      if (existingOther) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Tag với tên này đã tồn tại', statusCode: 400 },
          { status: 400 }
        );
      }

      updateData.name = body.name.trim();
      updateData.slug = newSlug;
    }

    await adminDb.collection(COLLECTIONS.tags).doc(id).update(updateData);

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Cập nhật tag thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// DELETE - Delete tag
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Unauthorized', statusCode: 401 },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Token không hợp lệ', statusCode: 401 },
        { status: 401 }
      );
    }

    // Only Admin can delete tags
    if (payload.role !== 'Admin') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền xóa tag', statusCode: 403 },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const tagDoc = await adminDb.collection(COLLECTIONS.tags).doc(id).get();

    if (!tagDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy tag', statusCode: 404 },
        { status: 404 }
      );
    }

    const batch = adminDb.batch();

    // Delete blog-tag relationships
    const blogTagsSnapshot = await adminDb
      .collection('blogTags')
      .where('tagId', '==', id)
      .get();

    blogTagsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete tag
    batch.delete(adminDb.collection(COLLECTIONS.tags).doc(id));

    await batch.commit();

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Xóa tag thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
