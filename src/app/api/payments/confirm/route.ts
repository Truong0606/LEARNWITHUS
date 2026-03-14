// POST /api/payments/confirm - Xác nhận thanh toán PayOS và áp dụng nâng cấp

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { getPaymentInfo } from '@/lib/payos';
import { ApiResponse, Payment, PaymentStatus, VIP_PLANS, VipPlanId } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    // Auth required
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

    const body = await request.json();
    const { orderCode } = body as { orderCode: number | string };

    if (!orderCode) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Thiếu orderCode', statusCode: 400 },
        { status: 400 }
      );
    }

    const orderCodeNum = typeof orderCode === 'string' ? parseInt(orderCode, 10) : orderCode;

    // 1. Verify payment status with PayOS
    const payosInfo = await getPaymentInfo(orderCodeNum);
    if (payosInfo.code !== '00' || payosInfo.data?.status !== 'PAID') {
      return NextResponse.json<ApiResponse<{ confirmed: false; payosStatus: string }>>(
        {
          data: { confirmed: false, payosStatus: payosInfo.data?.status ?? 'UNKNOWN' },
          message: 'Thanh toán chưa hoàn thành trên PayOS',
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    // 2. Find payment in Firestore by orderCode
    const paymentsSnap = await adminDb
      .collection(COLLECTIONS.payments)
      .where('orderCode', '==', orderCodeNum)
      .limit(1)
      .get();

    if (paymentsSnap.empty) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy bản ghi thanh toán', statusCode: 404 },
        { status: 404 }
      );
    }

    const paymentDoc = paymentsSnap.docs[0];
    const payment = paymentDoc.data() as Payment;

    // 3. Idempotency: already processed
    if (payment.status === PaymentStatus.Paid) {
      return NextResponse.json<ApiResponse<{ confirmed: true; alreadyProcessed: true }>>(
        {
          data: { confirmed: true, alreadyProcessed: true },
          message: 'Thanh toán đã được xử lý trước đó',
          statusCode: 200,
        },
        { status: 200 }
      );
    }

    // 4. Mark payment as Paid
    await adminDb.collection(COLLECTIONS.payments).doc(paymentDoc.id).update({
      status: PaymentStatus.Paid,
      paidAt: new Date(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 5. Apply business logic based on payment type
    if (payment.paymentFor === 'vip_upgrade' && payment.userId && payment.planId) {
      // Verify user owns this payment
      if (payment.userId !== payload.userId) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Không có quyền truy cập', statusCode: 403 },
          { status: 403 }
        );
      }

      const plan = VIP_PLANS[payment.planId as VipPlanId];
      if (!plan) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Gói VIP không hợp lệ', statusCode: 400 },
          { status: 400 }
        );
      }

      const vipExpiresAt = new Date();
      vipExpiresAt.setDate(vipExpiresAt.getDate() + plan.durationDays);

      await adminDb.collection(COLLECTIONS.users).doc(payment.userId).update({
        vipPlan: payment.planId,
        vipExpiresAt,
        updatedAt: FieldValue.serverTimestamp(),
      });


      return NextResponse.json<ApiResponse<{ confirmed: true; alreadyProcessed: false; vipExpiresAt: string }>>(
        {
          data: { confirmed: true, alreadyProcessed: false, vipExpiresAt: vipExpiresAt.toISOString() },
          message: `Nâng cấp VIP ${plan.name} thành công!`,
          statusCode: 200,
        },
        { status: 200 }
      );
    }

    if (payment.paymentFor === 'mentor_booking' && payment.mentorBookingId) {
      const mentorBookingDoc = await adminDb
        .collection(COLLECTIONS.mentorBookings)
        .doc(payment.mentorBookingId)
        .get();

      const bookingStatus = mentorBookingDoc.data()?.status;
      if (mentorBookingDoc.exists && ['pending', 'confirmed'].includes(bookingStatus)) {
        await adminDb.collection(COLLECTIONS.mentorBookings).doc(payment.mentorBookingId).update({
          status: 'paid',
          paymentId: paymentDoc.id,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      return NextResponse.json<ApiResponse<{ confirmed: true; alreadyProcessed: false }>>(
        {
          data: { confirmed: true, alreadyProcessed: false },
          message: 'Thanh toán lịch mentor thành công',
          statusCode: 200,
        },
        { status: 200 }
      );
    }

    // Generic success
    return NextResponse.json<ApiResponse<{ confirmed: true; alreadyProcessed: false }>>(
      {
        data: { confirmed: true, alreadyProcessed: false },
        message: 'Thanh toán đã được xác nhận',
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
