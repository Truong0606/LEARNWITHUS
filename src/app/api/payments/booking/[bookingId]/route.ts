// GET /api/payments/booking/[bookingId] - Get payments by booking ID

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { 
  Payment,
  TestBooking,
  ApiResponse,
  PaymentStatus 
} from '@/types';

interface RouteContext {
  params: Promise<{ bookingId: string }>;
}

// GET - Get payments by booking ID
export async function GET(
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

    const { bookingId } = await context.params;

    // Check booking permission
    const bookingDoc = await adminDb
      .collection(COLLECTIONS.testBookings)
      .doc(bookingId)
      .get();

    if (!bookingDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy đặt lịch', statusCode: 404 },
        { status: 404 }
      );
    }

    const booking = bookingDoc.data() as TestBooking;

    // Check permission
    if (payload.role === 'Client' && booking.clientId !== payload.userId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền truy cập', statusCode: 403 },
        { status: 403 }
      );
    }

    // Get payments
    const paymentsSnapshot = await adminDb
      .collection(COLLECTIONS.payments)
      .where('bookingId', '==', bookingId)
      .orderBy('createdAt', 'asc')
      .get();

    const payments: Payment[] = paymentsSnapshot.docs.map(doc => {
      const data = doc.data() as Payment;
      data.booking = booking;
      return data;
    });

    // Calculate summary
    const totalPaid = payments
      .filter(p => p.status === PaymentStatus.Paid)
      .reduce((sum, p) => sum + p.amount, 0);

    const totalPending = payments
      .filter(p => p.status === PaymentStatus.Pending)
      .reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json<ApiResponse<{
      payments: Payment[];
      summary: {
        totalPrice: number;
        totalPaid: number;
        totalPending: number;
        remainingToPay: number;
      };
    }>>(
      { 
        data: {
          payments,
          summary: {
            totalPrice: booking.price,
            totalPaid,
            totalPending,
            remainingToPay: booking.price - totalPaid
          }
        }, 
        message: 'Lấy danh sách thanh toán thành công', 
        statusCode: 200 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get payments by booking error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
