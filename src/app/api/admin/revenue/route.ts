// GET /api/admin/revenue - Aggregate revenue data from payments collection (Admin only)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { Timestamp } from 'firebase-admin/firestore';
import { PaymentStatus } from '@/types';
import type { ApiResponse, RevenueSourceType } from '@/types';

const SOURCE_TYPE_LABELS: Record<RevenueSourceType, string> = {
  vip_upgrade: 'Nâng cấp VIP',
  mentor_upgrade: 'Đăng ký Mentor',
  mentor_session: 'Học cùng Mentor',
  mentor_consultation: 'Tư vấn Mentor',
  test_booking: 'Xét nghiệm',
};

function toISOString(v: unknown): string {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (v && typeof v === 'object' && '_seconds' in (v as object)) {
    const t = v as { _seconds: number; _nanoseconds: number };
    return new Date(t._seconds * 1000 + t._nanoseconds / 1e6).toISOString();
  }
  if (v instanceof Date) return v.toISOString();
  return typeof v === 'string' ? v : '';
}

function resolveSourceType(payment: Record<string, unknown>): RevenueSourceType {
  const paymentFor = payment.paymentFor as string | undefined;

  if (paymentFor === 'vip_upgrade') return 'vip_upgrade';

  if (paymentFor === 'mentor_booking') {
    const mentorBookingId = payment.mentorBookingId as string | undefined;
    if (mentorBookingId) {
      return 'mentor_session';
    }
    return 'mentor_consultation';
  }

  if (payment.bookingId) return 'test_booking';

  return 'test_booking';
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Unauthorized', statusCode: 401 },
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
        { data: null, message: 'Chỉ Admin mới có quyền xem doanh thu', statusCode: 403 },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const typeFilter = searchParams.get('type') as RevenueSourceType | null;

    // Query all PAID payments (avoid composite index by sorting in-memory)
    const snapshot = await adminDb
      .collection(COLLECTIONS.payments)
      .where('status', '==', PaymentStatus.Paid)
      .limit(500)
      .get();

    // Also fetch mentor bookings to determine session vs consultation
    const mentorBookingCache: Record<string, string> = {};

    interface RevenueItem {
      id: string;
      sourceType: RevenueSourceType;
      amount: number;
      paidAt: string;
      description?: string;
      metadata?: Record<string, unknown>;
    }

    let items: RevenueItem[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data() as Record<string, unknown>;
      const amount = (data.amount as number) || 0;
      const paidAt = toISOString(data.paidAt || data.updatedAt || data.createdAt);

      let sourceType = resolveSourceType(data);

      // For mentor bookings, check the actual booking type
      if (data.paymentFor === 'mentor_booking' && data.mentorBookingId) {
        const mbId = data.mentorBookingId as string;
        if (!mentorBookingCache[mbId]) {
          try {
            const mbDoc = await adminDb.collection(COLLECTIONS.mentorBookings).doc(mbId).get();
            if (mbDoc.exists) {
              mentorBookingCache[mbId] = (mbDoc.data() as { type?: string })?.type || 'session';
            }
          } catch { /* ignore */ }
        }
        const bookingType = mentorBookingCache[mbId] || 'session';
        sourceType = bookingType === 'consultation' ? 'mentor_consultation' : 'mentor_session';
      }

      items.push({
        id: doc.id,
        sourceType,
        amount,
        paidAt,
        description: (data.description as string) || '',
        metadata: {
          orderCode: data.orderCode,
          paymentFor: data.paymentFor,
          userId: data.userId,
          planId: data.planId,
          bookingId: data.bookingId,
          mentorBookingId: data.mentorBookingId,
          description: data.description,
        },
      });
    }

    // Sort by paidAt descending (in-memory to avoid composite index requirement)
    items.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());

    // Apply date filters
    if (fromDate) {
      const from = new Date(fromDate);
      items = items.filter((item) => new Date(item.paidAt) >= from);
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      items = items.filter((item) => new Date(item.paidAt) <= to);
    }

    // Apply type filter
    if (typeFilter) {
      items = items.filter((item) => item.sourceType === typeFilter);
    }

    // Calculate summary
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    const byType: Record<RevenueSourceType, number> = {
      vip_upgrade: 0,
      mentor_upgrade: 0,
      mentor_session: 0,
      mentor_consultation: 0,
      test_booking: 0,
    };
    for (const item of items) {
      byType[item.sourceType] = (byType[item.sourceType] || 0) + item.amount;
    }

    return NextResponse.json<ApiResponse<{
      summary: { total: number; byType: Record<RevenueSourceType, number> };
      items: RevenueItem[];
      labels: Record<RevenueSourceType, string>;
    }>>({
      data: {
        summary: { total, byType },
        items,
        labels: SOURCE_TYPE_LABELS,
      },
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
