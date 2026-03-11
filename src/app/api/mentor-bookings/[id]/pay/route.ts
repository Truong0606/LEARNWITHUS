// POST /api/mentor-bookings/[id]/pay - Tạo link thanh toán PayOS cho mentor booking

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { createDocument } from '@/lib/firebase/firestore';
import { createPaymentLink, generateOrderCode, getPaymentInfo, PAYOS_CONFIG } from '@/lib/payos';
import { ApiResponse, PaymentStatus, MentorBooking, User, VIP_PLANS, VipPlanId } from '@/types';
import { getVipStatusFromUser, currentMonthKey } from '@/lib/vip';
import { FieldValue } from 'firebase-admin/firestore';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
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

    // Lấy mentor booking
    const bookingDoc = await adminDb.collection(COLLECTIONS.mentorBookings).doc(id).get();
    if (!bookingDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy đơn đặt lịch', statusCode: 404 },
        { status: 404 }
      );
    }

    const booking = bookingDoc.data() as MentorBooking;

    // Chỉ chủ booking mới được thanh toán
    if (booking.userId !== payload.userId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền thanh toán đơn này', statusCode: 403 },
        { status: 403 }
      );
    }

    // Chỉ thanh toán khi status là pending
    if (booking.status !== 'pending') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Đơn đặt lịch đã được thanh toán hoặc đã hủy', statusCode: 400 },
        { status: 400 }
      );
    }

    if (!booking.amount || booking.amount <= 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Số tiền không hợp lệ', statusCode: 400 },
        { status: 400 }
      );
    }

    // Kiểm tra xem đã có payment pending chưa (tránh tạo trùng)
    let existingPayment;
    try {
      existingPayment = await adminDb
        .collection(COLLECTIONS.payments)
        .where('mentorBookingId', '==', id)
        .where('status', '==', PaymentStatus.Pending)
        .limit(1)
        .get();
    } catch {
      // Fallback: query without composite index
      const allPayments = await adminDb
        .collection(COLLECTIONS.payments)
        .where('mentorBookingId', '==', id)
        .limit(10)
        .get();
      const pendingDocs = allPayments.docs.filter(
        (doc) => doc.data().status === PaymentStatus.Pending
      );
      existingPayment = {
        empty: pendingDocs.length === 0,
        docs: pendingDocs,
      };
    }

    if (!existingPayment.empty) {
      const existingDoc = existingPayment.docs[0];
      const existing = existingDoc.data();

      // Verify with PayOS whether the order is still active (PENDING)
      // If user cancelled it on PayOS side, our Firestore record is stale → create fresh order
      let payosStillPending = false;
      try {
        const payosInfo = await getPaymentInfo(existing.orderCode as number);
        payosStillPending = payosInfo.data?.status === 'PENDING';
      } catch {
        payosStillPending = false;
      }

      if (payosStillPending) {
        return NextResponse.json<ApiResponse<{
          paymentId: string;
          checkoutUrl: string;
          qrCode: string;
          orderCode: number;
          amount: number;
          isExisting: boolean;
        }>>(
          {
            data: {
              paymentId: existingDoc.id,
              checkoutUrl: existing.checkoutUrl || '',
              qrCode: existing.qrCode || '',
              orderCode: existing.orderCode,
              amount: existing.amount,
              isExisting: true,
            },
            message: 'Đã có yêu cầu thanh toán đang chờ xử lý',
            statusCode: 200,
          },
          { status: 200 }
        );
      }

      // Order was cancelled/expired on PayOS — mark as Cancelled and create new order
      await existingDoc.ref.update({
        status: PaymentStatus.Cancelled,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // Lấy thông tin user để điền buyerName, buyerEmail và kiểm tra VIP
    const userDoc = await adminDb.collection(COLLECTIONS.users).doc(payload.userId).get();
    const user = userDoc.exists ? (userDoc.data() as User) : null;
    const buyerName = user?.fullName || booking.userName;
    const buyerEmail = user?.email;

    // Tier 2: VIP free mentor sessions (based on plan)
    const { isVip, vipPlan } = user ? getVipStatusFromUser(user) : { isVip: false, vipPlan: null };
    if (isVip) {
      const monthKey = currentMonthKey();
      const usedThisMonth =
        user?.vipFreeSessionsMonthKey === monthKey ? (user?.vipFreeSessionsUsed ?? 0) : 0;

      // Get free session limit from the user's plan
      const planDetails = vipPlan ? VIP_PLANS[vipPlan as VipPlanId] : null;
      const freeSessionLimit = planDetails?.freeSessionsPerMonth ?? 2;

      if (usedThisMonth < freeSessionLimit) {
        // Use a free session: mark booking paid immediately, no PayOS needed
        const newUsed = usedThisMonth + 1;
        await Promise.all([
          adminDb.collection(COLLECTIONS.mentorBookings).doc(id).update({
            status: 'paid',
            isFreeVipSession: true,
            updatedAt: FieldValue.serverTimestamp(),
          }),
          adminDb.collection(COLLECTIONS.users).doc(payload.userId).update({
            vipFreeSessionsMonthKey: monthKey,
            vipFreeSessionsUsed: newUsed,
            updatedAt: FieldValue.serverTimestamp(),
          }),
        ]);
        return NextResponse.json<ApiResponse<{ isFreeSession: true; freeSessionsLeft: number }>>(
          {
            data: { isFreeSession: true, freeSessionsLeft: freeSessionLimit - newUsed },
            message: `Đã sử dụng buổi miễn phí VIP (${newUsed}/${freeSessionLimit} tháng này). Đặt lịch thành công!`,
            statusCode: 200,
          },
          { status: 200 }
        );
      }
    }

    // Tier 1: VIP gets discount when free sessions are exhausted
    let finalAmount = booking.amount;
    if (isVip) {
      const planDetails = vipPlan ? VIP_PLANS[vipPlan as VipPlanId] : null;
      const discountPercent = planDetails?.discountPercent ?? 10;
      finalAmount = Math.round(booking.amount * (1 - discountPercent / 100));
    }

    if (!finalAmount || finalAmount <= 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Số tiền không hợp lệ', statusCode: 400 },
        { status: 400 }
      );
    }

    const orderCode = generateOrderCode();

    const typeLabel = booking.type === 'session' ? 'Hoc cung mentor' : 'Tu van mentor';
    const description = `${typeLabel} ${id.slice(-6)}`;

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim();
    const returnUrl = `${baseUrl}/payment/success?mentorBookingId=${id}&type=mentor_booking`;
    const cancelUrl = `${baseUrl}/payment/cancel?mentorBookingId=${id}&type=mentor_booking`;

    const payosResponse = await createPaymentLink({
      orderCode,
      amount: finalAmount,
      description,
      buyerName,
      buyerEmail,
      returnUrl,
      cancelUrl,
      items: [
        {
          name: booking.type === 'session' ? 'Buổi học cùng mentor' : 'Tư vấn mentor',
          quantity: 1,
          price: finalAmount,
        },
      ],
    });

    if (payosResponse.code !== '00') {
      console.error('PayOS error:', payosResponse);
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: `Lỗi tạo thanh toán: ${payosResponse.desc}`, statusCode: 400 },
        { status: 400 }
      );
    }

    // Lưu payment vào Firestore
    const paymentId = await createDocument(COLLECTIONS.payments, {
      orderCode,
      amount: finalAmount,
      status: PaymentStatus.Pending,
      description,
      mentorBookingId: id,
      paymentFor: 'mentor_booking',
      checkoutUrl: payosResponse.data?.checkoutUrl || '',
      qrCode: payosResponse.data?.qrCode || '',
    });

    return NextResponse.json<ApiResponse<{
      paymentId: string;
      checkoutUrl: string;
      qrCode: string;
      orderCode: number;
      amount: number;
      isExisting: boolean;
    }>>(
      {
        data: {
          paymentId,
          checkoutUrl: payosResponse.data?.checkoutUrl || '',
          qrCode: payosResponse.data?.qrCode || '',
          orderCode,
          amount: finalAmount,
          isExisting: false,
        },
        message: 'Tạo link thanh toán thành công',
        statusCode: 201,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/mentor-bookings/[id]/pay error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
