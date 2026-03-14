// GET /api/mentor-bookings/[id] - Get single booking
// PATCH /api/mentor-bookings/[id] - Update status (Admin, mentor owner, or booking owner)
// DELETE /api/mentor-bookings/[id] - Cancel booking (with 24h policy)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { ApiResponse, MentorBookingStatus } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function serializeBooking(data: Record<string, unknown>, id: string) {
  const toStr = (v: unknown): string => {
    if (v instanceof Timestamp) return v.toDate().toISOString();
    if (v && typeof v === 'object' && '_seconds' in (v as object)) {
      const t = v as { _seconds: number; _nanoseconds: number };
      return new Date(t._seconds * 1000 + t._nanoseconds / 1e6).toISOString();
    }
    return typeof v === 'string' ? v : '';
  };
  return {
    ...data,
    id,
    createdAt: toStr(data.createdAt),
    updatedAt: data.updatedAt ? toStr(data.updatedAt) : undefined,
    scheduledAt: toStr(data.scheduledAt),
    cancelledAt: data.cancelledAt ? toStr(data.cancelledAt) : undefined,
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const doc = await adminDb.collection(COLLECTIONS.mentorBookings).doc(id).get();
    if (!doc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy đơn đặt lịch', statusCode: 404 },
        { status: 404 }
      );
    }
    const data = doc.data() as Record<string, unknown>;
    const booking = serializeBooking(data, doc.id);
    return NextResponse.json<ApiResponse<typeof booking>>({
      data: booking,
      message: 'OK',
      statusCode: 200,
    });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

const VALID_STATUSES: MentorBookingStatus[] = ['pending', 'confirmed', 'paid', 'completed', 'cancelled'];

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

    const booking = doc.data() as { userId: string; mentorId: string; status: string };
    const isAdmin = payload.role === 'Admin';
    const isMentor = booking.mentorId === payload.userId;
    const isOwner = booking.userId === payload.userId;

    if (!isAdmin && !isMentor && !isOwner) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền cập nhật', statusCode: 403 },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, mentorPaid } = body;

    // Admin: mark mentor as paid (separate from status changes)
    if (mentorPaid === true && isAdmin) {
      if (booking.status !== 'completed') {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Chỉ thanh toán cho mentor khi đơn đã hoàn thành', statusCode: 400 },
          { status: 400 }
        );
      }
      await docRef.update({
        mentorPaid: true,
        mentorPaidAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      const updated = await docRef.get();
      const data = updated.data() as Record<string, unknown>;
      const result = serializeBooking(data, id);
      return NextResponse.json<ApiResponse<typeof result>>({
        data: result,
        message: 'Đã thanh toán cho mentor thành công',
        statusCode: 200,
      });
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Trạng thái không hợp lệ', statusCode: 400 },
        { status: 400 }
      );
    }

    // Mentor can confirm or complete; owner can cancel
    if (isMentor && !isAdmin) {
      if (!['confirmed', 'completed', 'cancelled'].includes(status)) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Mentor chỉ có thể xác nhận, hoàn thành hoặc hủy', statusCode: 403 },
          { status: 403 }
        );
      }
    }

    const updates: Record<string, unknown> = {
      status,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Track completion for mentor stats
    if (status === 'completed') {
      updates.completedAt = FieldValue.serverTimestamp();

      // Update mentor profile stats
      const profileSnap = await adminDb
        .collection(COLLECTIONS.mentorProfiles)
        .where('userId', '==', booking.mentorId)
        .limit(1)
        .get();
      if (!profileSnap.empty) {
        const profileRef = profileSnap.docs[0].ref;
        await profileRef.update({
          sessionCount: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    await docRef.update(updates);

    const updated = await docRef.get();
    const data = updated.data() as Record<string, unknown>;
    const result = serializeBooking(data, id);
    return NextResponse.json<ApiResponse<typeof result>>({
      data: result,
      message: 'Cập nhật thành công',
      statusCode: 200,
    });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
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

    const booking = doc.data() as {
      userId: string;
      mentorId: string;
      status: string;
      scheduledAt: Timestamp | { _seconds: number };
    };
    const isAdmin = payload.role === 'Admin';
    const isOwner = booking.userId === payload.userId;
    const isMentor = booking.mentorId === payload.userId;

    if (!isAdmin && !isOwner && !isMentor) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền hủy', statusCode: 403 },
        { status: 403 }
      );
    }

    if (booking.status === 'completed') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không thể hủy đơn đã hoàn thành', statusCode: 400 },
        { status: 400 }
      );
    }

    // Check 24h cancellation policy for paid bookings
    let canRefund = false;
    if (booking.status === 'paid' || booking.status === 'confirmed') {
      let scheduledDate: Date;
      if (booking.scheduledAt instanceof Timestamp) {
        scheduledDate = booking.scheduledAt.toDate();
      } else if (booking.scheduledAt && typeof booking.scheduledAt === 'object' && '_seconds' in booking.scheduledAt) {
        scheduledDate = new Date(booking.scheduledAt._seconds * 1000);
      } else {
        scheduledDate = new Date(booking.scheduledAt as unknown as string);
      }

      const hoursUntilSession = (scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60);
      canRefund = hoursUntilSession >= 24;
    }

    await docRef.update({
      status: 'cancelled',
      cancelledAt: FieldValue.serverTimestamp(),
      cancelledBy: payload.userId,
      cancelReason: isOwner ? 'Người đặt hủy' : isMentor ? 'Mentor hủy' : 'Admin hủy',
      canRefund,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json<ApiResponse<{ id: string; canRefund: boolean }>>(
      {
        data: { id, canRefund },
        message: canRefund
          ? 'Đã hủy đơn đặt lịch. Bạn sẽ được hoàn tiền.'
          : 'Đã hủy đơn đặt lịch. Không đủ điều kiện hoàn tiền (hủy trong vòng 24h trước buổi học).',
        statusCode: 200,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
