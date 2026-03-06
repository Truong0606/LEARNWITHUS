// POST /api/payments/webhook - PayOS webhook callback

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import {
  Payment,
  ApiResponse,
  PaymentStatus,
  BookingStatus,
  VIP_PLANS,
  VipPlanId,
} from '@/types';
import { verifyWebhookSignature, PayOSWebhookData } from '@/lib/payos';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('PayOS Webhook received:', JSON.stringify(body, null, 2));

    const { data, signature } = body as {
      code: string;
      desc: string;
      success: boolean;
      data: PayOSWebhookData;
      signature: string;
    };

    if (!data || !signature) {
      console.error('Missing data or signature in webhook');
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Invalid webhook data', statusCode: 400 },
        { status: 400 }
      );
    }

    // Verify signature using PayOS SDK
    const isValid = await verifyWebhookSignature(body);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Invalid signature', statusCode: 401 },
        { status: 401 }
      );
    }

    const { orderCode, code, desc } = data;

    // Tìm payment theo orderCode
    const paymentsSnapshot = await adminDb
      .collection(COLLECTIONS.payments)
      .where('orderCode', '==', orderCode)
      .limit(1)
      .get();

    if (paymentsSnapshot.empty) {
      console.error(`Payment not found for orderCode: ${orderCode}`);
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Payment not found', statusCode: 404 },
        { status: 404 }
      );
    }

    const paymentDoc = paymentsSnapshot.docs[0];
    const payment = paymentDoc.data() as Payment;

    if (code === '00') {
      // Thanh toán thành công
      await adminDb.collection(COLLECTIONS.payments).doc(paymentDoc.id).update({
        status: PaymentStatus.Paid,
        paidAt: new Date(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      if (payment.paymentFor === 'mentor_booking' && payment.mentorBookingId) {
        // --- Mentor booking payment ---
        const mentorBookingDoc = await adminDb
          .collection(COLLECTIONS.mentorBookings)
          .doc(payment.mentorBookingId)
          .get();

        if (mentorBookingDoc.exists) {
          const currentStatus = mentorBookingDoc.data()?.status;
          if (currentStatus === 'pending') {
            await adminDb
              .collection(COLLECTIONS.mentorBookings)
              .doc(payment.mentorBookingId)
              .update({
                status: 'paid',
                paymentId: paymentDoc.id,
                updatedAt: FieldValue.serverTimestamp(),
              });
            console.log(`MentorBooking ${payment.mentorBookingId} updated to paid`);
          }
        }
      } else if (payment.paymentFor === 'vip_upgrade' && payment.userId && payment.planId) {
        // --- VIP upgrade payment ---
        const plan = VIP_PLANS[payment.planId as VipPlanId];
        if (plan) {
          const vipExpiresAt = new Date();
          vipExpiresAt.setDate(vipExpiresAt.getDate() + plan.durationDays);

          await adminDb.collection(COLLECTIONS.users).doc(payment.userId).update({
            vipPlan: payment.planId,
            vipExpiresAt,
            updatedAt: FieldValue.serverTimestamp(),
          });
          console.log(
            `User ${payment.userId} upgraded to VIP plan "${payment.planId}", expires ${vipExpiresAt.toISOString()}`
          );
        }
      } else if (payment.bookingId) {
        // --- Test booking payment ---
        const bookingDoc = await adminDb
          .collection(COLLECTIONS.testBookings)
          .doc(payment.bookingId)
          .get();

        if (bookingDoc.exists) {
          const currentStatus = bookingDoc.data()?.status;

          // Thanh toán đặt cọc → DepositPaid
          if (currentStatus === BookingStatus.Pending && payment.depositAmount) {
            await adminDb
              .collection(COLLECTIONS.testBookings)
              .doc(payment.bookingId)
              .update({
                status: BookingStatus.DepositPaid,
                updatedAt: FieldValue.serverTimestamp(),
              });
            console.log(`Booking ${payment.bookingId} updated to DepositPaid`);
          }

          // Thanh toán còn lại → FullyPaid
          if (currentStatus === BookingStatus.ResultReady && payment.remainingAmount) {
            await adminDb
              .collection(COLLECTIONS.testBookings)
              .doc(payment.bookingId)
              .update({
                status: BookingStatus.FullyPaid,
                updatedAt: FieldValue.serverTimestamp(),
              });
            console.log(`Booking ${payment.bookingId} updated to FullyPaid`);
          }
        }
      }

      console.log(`Payment ${paymentDoc.id} marked as PAID`);
    } else {
      // Thanh toán thất bại
      await adminDb.collection(COLLECTIONS.payments).doc(paymentDoc.id).update({
        status: PaymentStatus.Failed,
        description: `${payment.description || ''} - Error: ${desc}`,
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log(`Payment ${paymentDoc.id} marked as FAILED: ${desc}`);
    }

    // Luôn trả 200 để PayOS không retry
    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Webhook processed', statusCode: 200 },
      { status: 200 }
    );
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Trả 200 để tránh PayOS retry liên tục
    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: false }, message: 'Webhook error', statusCode: 200 },
      { status: 200 }
    );
  }
}
