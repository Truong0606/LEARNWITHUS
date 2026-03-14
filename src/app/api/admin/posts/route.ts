// GET /api/admin/posts - List all community posts (Admin only)
// Supports ?groupId= to filter by study group

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { Timestamp } from 'firebase-admin/firestore';
import type { ApiResponse, CommunityPost } from '@/types';

function serializeTimestamps<T extends Record<string, unknown>>(doc: T): T {
  const result = { ...doc };
  for (const key of Object.keys(result)) {
    const val = result[key];
    if (val instanceof Timestamp) {
      (result as Record<string, unknown>)[key] = val.toDate().toISOString();
    } else if (val && typeof val === 'object' && '_seconds' in (val as object) && '_nanoseconds' in (val as object)) {
      const ts = val as { _seconds: number; _nanoseconds: number };
      (result as Record<string, unknown>)[key] = new Date(ts._seconds * 1000 + ts._nanoseconds / 1e6).toISOString();
    }
  }
  return result;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng đăng nhập', statusCode: 401 },
        { status: 401 }
      );
    }

    const payload = verifyToken(authHeader.split(' ')[1]);
    if (!payload) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Token không hợp lệ', statusCode: 401 },
        { status: 401 }
      );
    }

    if (payload.role !== 'Admin') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền truy cập', statusCode: 403 },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    let query = adminDb
      .collection(COLLECTIONS.communityPosts)
      .orderBy('createdAt', 'desc')
      .limit(200);

    const snapshot = await query.get();

    let posts = snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      return serializeTimestamps({ ...data, id: data.id ?? doc.id }) as unknown as CommunityPost;
    });

    if (groupId && groupId !== '__community__') {
      posts = posts.filter((p) => p.groupId === groupId);
    }

    return NextResponse.json<ApiResponse<CommunityPost[]>>({
      data: posts,
      message: 'Lấy danh sách bài viết thành công',
      statusCode: 200,
    });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
