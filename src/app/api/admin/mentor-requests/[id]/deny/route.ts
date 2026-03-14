// PATCH /api/admin/mentor-requests/[id]/deny - Deny mentor request (Admin only)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { FieldValue } from 'firebase-admin/firestore';
import type { ApiResponse } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Unauthorized', statusCode: 401 },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Token không hợp lệ', statusCode: 401 },
        { status: 401 }
      );
    }

    if (payload.role !== 'Admin') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Chỉ Admin mới có quyền từ chối yêu cầu Mentor', statusCode: 403 },
        { status: 403 }
      );
    }

    const requestDoc = await adminDb
      .collection(COLLECTIONS.mentorRequests)
      .doc(id)
      .get();

    if (!requestDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy yêu cầu Mentor', statusCode: 404 },
        { status: 404 }
      );
    }

    const mentorRequest = requestDoc.data() as { status: string };
    if (mentorRequest.status !== 'pending') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Yêu cầu này đã được xử lý', statusCode: 400 },
        { status: 400 }
      );
    }

    const now = FieldValue.serverTimestamp();

    await adminDb.collection(COLLECTIONS.mentorRequests).doc(id).update({
      status: 'denied',
      deniedBy: payload.userId,
      deniedAt: now,
      updatedAt: now,
    });

    return NextResponse.json<ApiResponse<{ ok: boolean }>>(
      { data: { ok: true }, message: 'Đã từ chối yêu cầu Mentor', statusCode: 200 },
      { status: 200 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
