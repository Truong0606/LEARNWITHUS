// GET /api/payments - Get all payments (Admin/Staff see all, Client sees own)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { Payment, ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Unauthorized', statusCode: 401 },
        { status: 401 }
      );
    }

    const payload = verifyToken(authHeader.substring(7));
    if (!payload) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Token không hợp lệ', statusCode: 401 },
        { status: 401 }
      );
    }

    let paymentsQuery: FirebaseFirestore.Query = adminDb.collection(COLLECTIONS.payments);

    if (payload.role === 'Client') {
      const [vipPaymentsSnap, mentorBookingsSnap] = await Promise.all([
        adminDb.collection(COLLECTIONS.payments).where('userId', '==', payload.userId).get(),
        adminDb.collection(COLLECTIONS.mentorBookings).where('userId', '==', payload.userId).get(),
      ]);
      const mentorBookingIds = new Set(mentorBookingsSnap.docs.map((d) => d.id));

      const mentorPaymentDocs = mentorBookingIds.size > 0
        ? (await adminDb.collection(COLLECTIONS.payments)
            .where('mentorBookingId', 'in', Array.from(mentorBookingIds).slice(0, 30))
            .get()).docs
        : [];

      const allDocs = [...vipPaymentsSnap.docs, ...mentorPaymentDocs];
      const seen = new Set<string>();
      const payments: Payment[] = allDocs
        .filter((doc) => {
          if (seen.has(doc.id)) return false;
          seen.add(doc.id);
          return true;
        })
        .map((doc) => ({ id: doc.id, ...doc.data() } as Payment))
        .sort((a, b) => {
          const toMs = (v: unknown) => {
            if (v && typeof v === 'object' && 'toDate' in v && typeof (v as { toDate: () => Date }).toDate === 'function') {
              return (v as { toDate: () => Date }).toDate().getTime();
            }
            return new Date(v as string | number).getTime();
          };
          return toMs(b.createdAt) - toMs(a.createdAt);
        });

      return NextResponse.json<ApiResponse<Payment[]>>(
        { data: payments, message: 'Lấy danh sách thanh toán thành công', statusCode: 200 },
        { status: 200 }
      );
    }

    const paymentsSnapshot = await paymentsQuery.orderBy('createdAt', 'desc').get();
    const payments: Payment[] = paymentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Payment));

    return NextResponse.json<ApiResponse<Payment[]>>(
      { data: payments, message: 'Lấy danh sách thanh toán thành công', statusCode: 200 },
      { status: 200 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
