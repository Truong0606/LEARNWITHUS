// GET /api/payments/[id] - Get payment by ID
// DELETE /api/payments/[id] - Cancel payment

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { 
  Payment,
  TestBooking,
  ApiResponse,
  PaymentStatus 
} from '@/types';
import { cancelPaymentLink, getPaymentInfo } from '@/lib/payos';
import { FieldValue } from 'firebase-admin/firestore';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get payment by ID with PayOS status
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

    const { id } = await context.params;

    // Get payment
    const paymentDoc = await adminDb.collection(COLLECTIONS.payments).doc(id).get();

    if (!paymentDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy thanh toán', statusCode: 404 },
        { status: 404 }
      );
    }

    const payment = paymentDoc.data() as Payment;

    // Check permission
    if (payload.role === 'Client') {
      if (payment.bookingId) {
        const bookingDoc = await adminDb
          .collection(COLLECTIONS.testBookings)
          .doc(payment.bookingId)
          .get();

        if (bookingDoc.exists) {
          const booking = bookingDoc.data() as TestBooking;
          if (booking.clientId !== payload.userId) {
            return NextResponse.json<ApiResponse<null>>(
              { data: null, message: 'Không có quyền truy cập', statusCode: 403 },
              { status: 403 }
            );
          }
          payment.booking = booking;
        }
      } else if (payment.mentorBookingId) {
        // Mentor booking payment: only the booking owner can access
        const mbDoc = await adminDb
          .collection(COLLECTIONS.mentorBookings)
          .doc(payment.mentorBookingId)
          .get();

        if (mbDoc.exists && (mbDoc.data() as { userId: string }).userId !== payload.userId) {
          return NextResponse.json<ApiResponse<null>>(
            { data: null, message: 'Không có quyền truy cập', statusCode: 403 },
            { status: 403 }
          );
        }
      }
    }

    // Get real-time status from PayOS if pending
    if (payment.status === PaymentStatus.Pending) {
      try {
        const payosInfo = await getPaymentInfo(payment.orderCode);
        if (payosInfo.code === '00' && payosInfo.data) {
          // Update local status if changed
          if (payosInfo.data.status === 'PAID') {
            await adminDb.collection(COLLECTIONS.payments).doc(id).update({
              status: PaymentStatus.Paid,
              paidAt: new Date(),
              updatedAt: FieldValue.serverTimestamp()
            });
            payment.status = PaymentStatus.Paid;
            payment.paidAt = new Date();
          } else if (payosInfo.data.status === 'CANCELLED') {
            await adminDb.collection(COLLECTIONS.payments).doc(id).update({
              status: PaymentStatus.Cancelled,
              updatedAt: FieldValue.serverTimestamp()
            });
            payment.status = PaymentStatus.Cancelled;
          }
        }
      } catch (payosError) {
        console.warn('Could not fetch PayOS status:', payosError);
      }
    }

    return NextResponse.json<ApiResponse<Payment>>(
      { data: payment, message: 'Lấy thông tin thanh toán thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get payment error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// DELETE - Cancel payment
export async function DELETE(
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

    const { id } = await context.params;

    // Get payment
    const paymentDoc = await adminDb.collection(COLLECTIONS.payments).doc(id).get();

    if (!paymentDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy thanh toán', statusCode: 404 },
        { status: 404 }
      );
    }

    const payment = paymentDoc.data() as Payment;

    // Check permission
    if (payload.role === 'Client') {
      if (payment.bookingId) {
        const bookingDoc = await adminDb
          .collection(COLLECTIONS.testBookings)
          .doc(payment.bookingId)
          .get();

        if (bookingDoc.exists) {
          const booking = bookingDoc.data() as TestBooking;
          if (booking.clientId !== payload.userId) {
            return NextResponse.json<ApiResponse<null>>(
              { data: null, message: 'Không có quyền hủy thanh toán này', statusCode: 403 },
              { status: 403 }
            );
          }
        }
      } else if (payment.mentorBookingId) {
        const mbDoc = await adminDb
          .collection(COLLECTIONS.mentorBookings)
          .doc(payment.mentorBookingId)
          .get();

        if (mbDoc.exists && (mbDoc.data() as { userId: string }).userId !== payload.userId) {
          return NextResponse.json<ApiResponse<null>>(
            { data: null, message: 'Không có quyền hủy thanh toán này', statusCode: 403 },
            { status: 403 }
          );
        }
      }
    }

    // Only allow cancellation of pending payments
    if (payment.status !== PaymentStatus.Pending) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Chỉ có thể hủy thanh toán đang chờ', statusCode: 400 },
        { status: 400 }
      );
    }

    // Cancel on PayOS
    try {
      await cancelPaymentLink(payment.orderCode, 'User cancelled');
    } catch (payosError) {
      console.warn('PayOS cancel error:', payosError);
    }

    // Update local status
    await adminDb.collection(COLLECTIONS.payments).doc(id).update({
      status: PaymentStatus.Cancelled,
      updatedAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Hủy thanh toán thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Cancel payment error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
