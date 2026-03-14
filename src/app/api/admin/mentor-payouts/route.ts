// GET /api/admin/mentor-payouts - List all pending/paid mentor payouts (Admin only)
// POST /api/admin/mentor-payouts - Mark bookings as mentor-paid in bulk (Admin only)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { ApiResponse } from '@/types';

function toStr(v: unknown): string {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (v && typeof v === 'object' && '_seconds' in (v as object)) {
    const t = v as { _seconds: number; _nanoseconds: number };
    return new Date(t._seconds * 1000 + t._nanoseconds / 1e6).toISOString();
  }
  return typeof v === 'string' ? v : '';
}

interface PayoutItem {
  bookingId: string;
  mentorId: string;
  mentorName: string;
  userId: string;
  userName: string;
  topic: string;
  type: string;
  amount: number;
  mentorAmount: number;
  scheduledAt: string;
  completedAt?: string;
  mentorPaid: boolean;
  mentorPaidAt?: string;
  isFreeVipSession: boolean;
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
    if (!payload || payload.role !== 'Admin') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Chỉ Admin mới có quyền xem thanh toán Mentor', statusCode: 403 },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const mentorIdFilter = searchParams.get('mentorId');
    const paidFilter = searchParams.get('paid'); // 'true' | 'false' | null

    let query: FirebaseFirestore.Query = adminDb
      .collection(COLLECTIONS.mentorBookings)
      .where('status', '==', 'completed');

    if (mentorIdFilter) {
      query = query.where('mentorId', '==', mentorIdFilter);
    }

    const snapshot = await query.limit(500).get();

    let items: PayoutItem[] = snapshot.docs
      .map((doc) => {
        const d = doc.data() as Record<string, unknown>;
        const isFreeVipSession = Boolean(d.isFreeVipSession);
        const amount = (d.amount as number) || 0;
        const mentorAmount = isFreeVipSession ? 0 : Math.round(amount * 0.8);
        return {
          bookingId: doc.id,
          mentorId: (d.mentorId as string) || '',
          mentorName: (d.mentorName as string) || '',
          userId: (d.userId as string) || '',
          userName: (d.userName as string) || '',
          topic: (d.topic as string) || '',
          type: (d.type as string) || 'session',
          amount,
          mentorAmount,
          scheduledAt: toStr(d.scheduledAt),
          completedAt: d.completedAt ? toStr(d.completedAt) : undefined,
          mentorPaid: Boolean(d.mentorPaid),
          mentorPaidAt: d.mentorPaidAt ? toStr(d.mentorPaidAt) : undefined,
          isFreeVipSession,
        };
      })
      .filter((item) => !item.isFreeVipSession); // Exclude free VIP sessions (no payment needed)

    if (paidFilter === 'true') {
      items = items.filter((i) => i.mentorPaid);
    } else if (paidFilter === 'false') {
      items = items.filter((i) => !i.mentorPaid);
    }

    // Sort by completedAt desc
    items.sort((a, b) => {
      const da = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const db = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return db - da;
    });

    // Aggregate by mentor
    const byMentor: Record<string, { mentorId: string; mentorName: string; totalOwed: number; totalPaid: number; pendingItems: number }> = {};
    for (const item of items) {
      if (!byMentor[item.mentorId]) {
        byMentor[item.mentorId] = {
          mentorId: item.mentorId,
          mentorName: item.mentorName,
          totalOwed: 0,
          totalPaid: 0,
          pendingItems: 0,
        };
      }
      if (item.mentorPaid) {
        byMentor[item.mentorId].totalPaid += item.mentorAmount;
      } else {
        byMentor[item.mentorId].totalOwed += item.mentorAmount;
        byMentor[item.mentorId].pendingItems += 1;
      }
    }

    return NextResponse.json<ApiResponse<{
      items: PayoutItem[];
      byMentor: typeof byMentor;
      summary: { totalOwed: number; totalPaid: number };
    }>>({
      data: {
        items,
        byMentor,
        summary: {
          totalOwed: items.filter((i) => !i.mentorPaid).reduce((s, i) => s + i.mentorAmount, 0),
          totalPaid: items.filter((i) => i.mentorPaid).reduce((s, i) => s + i.mentorAmount, 0),
        },
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

export async function POST(request: NextRequest) {
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
        { data: null, message: 'Chỉ Admin mới có quyền xác nhận thanh toán Mentor', statusCode: 403 },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { bookingIds } = body as { bookingIds: string[] };

    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng chọn ít nhất 1 đơn để thanh toán', statusCode: 400 },
        { status: 400 }
      );
    }

    if (bookingIds.length > 50) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Tối đa 50 đơn mỗi lần', statusCode: 400 },
        { status: 400 }
      );
    }

    const now = FieldValue.serverTimestamp();
    const batch = adminDb.batch();

    for (const bookingId of bookingIds) {
      const ref = adminDb.collection(COLLECTIONS.mentorBookings).doc(bookingId);
      batch.update(ref, {
        mentorPaid: true,
        mentorPaidAt: now,
        mentorPaidBy: payload.userId,
        updatedAt: now,
      });
    }

    await batch.commit();

    return NextResponse.json<ApiResponse<{ count: number }>>({
      data: { count: bookingIds.length },
      message: `Đã xác nhận thanh toán cho ${bookingIds.length} đơn Mentor`,
      statusCode: 200,
    });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
