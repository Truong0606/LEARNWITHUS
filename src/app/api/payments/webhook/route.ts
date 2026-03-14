// POST /api/payments/webhook - PayOS webhook callback

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import {
  Payment,
  ApiResponse,
  PaymentStatus,
  VIP_PLANS,
  VipPlanId,
} from '@/types';
import { verifyWebhookSignature, PayOSWebhookData } from '@/lib/payos';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, signature } = body as {
      code: string;
      desc: string;
      success: boolean;
      data: PayOSWebhookData;
      signature: string;
    };

    if (!data || !signature) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Invalid webhook data', statusCode: 400 },
        { status: 400 }
      );
    }

    // Verify signature using PayOS SDK
    const isValid = await verifyWebhookSignature(body);
    if (!isValid) {
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
          if (['pending', 'confirmed'].includes(currentStatus)) {
            await adminDb
              .collection(COLLECTIONS.mentorBookings)
              .doc(payment.mentorBookingId)
              .update({
                status: 'paid',
                paymentId: paymentDoc.id,
                updatedAt: FieldValue.serverTimestamp(),
              });
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
        }
      }

    } else {
      // Thanh toán thất bại
      await adminDb.collection(COLLECTIONS.payments).doc(paymentDoc.id).update({
        status: PaymentStatus.Failed,
        description: `${payment.description || ''} - Error: ${desc}`,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // Luôn trả 200 để PayOS không retry
    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Webhook processed', statusCode: 200 },
      { status: 200 }
    );
  } catch {
    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: false }, message: 'Webhook error', statusCode: 200 },
      { status: 200 }
    );
  }
}
