// PATCH /api/admin/mentors/[id]/toggle-active - Enable/disable a mentor profile (Admin only)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { FieldValue } from 'firebase-admin/firestore';
import type { ApiResponse } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Unauthorized', statusCode: 401 },
        { status: 401 }
      );
    }
    const payload = verifyToken(authHeader.split(' ')[1]);
    if (!payload || payload.role !== 'Admin') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Chỉ Admin mới có quyền thực hiện thao tác này', statusCode: 403 },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const profileRef = adminDb.collection(COLLECTIONS.mentorProfiles).doc(id);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy hồ sơ Mentor', statusCode: 404 },
        { status: 404 }
      );
    }

    const profile = profileDoc.data() as { isActive: boolean; userId: string };
    const newIsActive = !profile.isActive;

    await profileRef.update({
      isActive: newIsActive,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json<ApiResponse<{ isActive: boolean }>>({
      data: { isActive: newIsActive },
      message: newIsActive ? 'Đã kích hoạt Mentor' : 'Đã vô hiệu hóa Mentor',
      statusCode: 200,
    });
  } catch (error) {
    console.error('PATCH /api/admin/mentors/[id]/toggle-active error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
