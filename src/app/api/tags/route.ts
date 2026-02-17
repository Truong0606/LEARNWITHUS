// GET /api/tags - Get all tags
// POST /api/tags - Create tag (Staff/Admin only)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { createDocument } from '@/lib/firebase/firestore';
import { Tag, ApiResponse } from '@/types';

// Generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// GET - Get all tags
export async function GET() {
  try {
    const tagsSnapshot = await adminDb
      .collection(COLLECTIONS.tags)
      .orderBy('name', 'asc')
      .get();

    const tags: Tag[] = tagsSnapshot.docs.map(doc => doc.data() as Tag);

    return NextResponse.json<ApiResponse<Tag[]>>(
      { data: tags, message: 'Lấy danh sách tag thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get tags error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// POST - Create tag
export async function POST(request: NextRequest) {
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

    // Only Staff, Manager, Admin can create tags
    if (!['Staff', 'Manager', 'Admin'].includes(payload.role)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền tạo tag', statusCode: 403 },
        { status: 403 }
      );
    }

    const body: { name: string } = await request.json();
    const { name } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Tên tag không được để trống', statusCode: 400 },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = generateSlug(name);

    // Check if slug exists
    const existingSnapshot = await adminDb
      .collection(COLLECTIONS.tags)
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Tag đã tồn tại', statusCode: 400 },
        { status: 400 }
      );
    }

    // Create tag
    const tagData: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'> = {
      name: name.trim(),
      slug
    };

    const tagId = await createDocument(COLLECTIONS.tags, tagData);

    return NextResponse.json<ApiResponse<{ tagId: string; slug: string }>>(
      { data: { tagId, slug }, message: 'Tạo tag thành công', statusCode: 201 },
      { status: 201 }
    );

  } catch (error) {
    console.error('Create tag error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
