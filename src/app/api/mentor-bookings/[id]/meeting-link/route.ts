// PATCH /api/mentor-bookings/[id]/meeting-link - Mentor sets the meeting link for an online session

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

    const { id } = await context.params;
    const docRef = adminDb.collection(COLLECTIONS.mentorBookings).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy đơn đặt lịch', statusCode: 404 },
        { status: 404 }
      );
    }

    const booking = doc.data() as { mentorId: string; status: string };
    const isAdmin = payload.role === 'Admin';
    const isMentor = booking.mentorId === payload.userId;

    if (!isAdmin && !isMentor) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Chỉ Mentor hoặc Admin mới có thể đặt link họp', statusCode: 403 },
        { status: 403 }
      );
    }

    if (!['confirmed', 'paid'].includes(booking.status)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Chỉ đặt link họp cho buổi đã xác nhận hoặc đã thanh toán', statusCode: 400 },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { meetingLink } = body as { meetingLink: string };

    if (!meetingLink?.trim()) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng nhập link họp', statusCode: 400 },
        { status: 400 }
      );
    }

    // Basic URL validation
    try {
      new URL(meetingLink.trim());
    } catch {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Link họp không hợp lệ. Vui lòng nhập URL đầy đủ (https://...)', statusCode: 400 },
        { status: 400 }
      );
    }

    await docRef.update({
      meetingLink: meetingLink.trim(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json<ApiResponse<{ meetingLink: string }>>({
      data: { meetingLink: meetingLink.trim() },
      message: 'Đã cập nhật link họp thành công',
      statusCode: 200,
    });
  } catch (error) {
    console.error('PATCH /api/mentor-bookings/[id]/meeting-link error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
