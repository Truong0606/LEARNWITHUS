// POST /api/payments/webhook - PayOS webhook callback

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { 
  Payment,
  ApiResponse,
  PaymentStatus,
  BookingStatus 
} from '@/types';
import { verifyWebhookSignature, PayOSWebhookData } from '@/lib/payos';
import { FieldValue } from 'firebase-admin/firestore';

// POST - Handle PayOS webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('PayOS Webhook received:', JSON.stringify(body, null, 2));

    const { data, signature } = body as { 
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

    // Verify signature
    const isValid = verifyWebhookSignature(data, signature);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Invalid signature', statusCode: 401 },
        { status: 401 }
      );
    }

    const { orderCode, code, desc } = data;

    // Find payment by orderCode
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

    // Check payment status from webhook
    // PayOS code '00' = success
    if (code === '00') {
      // Payment successful
      await adminDb.collection(COLLECTIONS.payments).doc(paymentDoc.id).update({
        status: PaymentStatus.Paid,
        paidAt: new Date(),
        updatedAt: FieldValue.serverTimestamp()
      });

      // Update booking status based on payment type
      if (payment.bookingId) {
        const bookingDoc = await adminDb
          .collection(COLLECTIONS.testBookings)
          .doc(payment.bookingId)
          .get();

        if (bookingDoc.exists) {
          const currentStatus = bookingDoc.data()?.status;
          
          // Deposit payment - move to DepositPaid
          if (currentStatus === BookingStatus.Pending && payment.depositAmount) {
            await adminDb.collection(COLLECTIONS.testBookings).doc(payment.bookingId).update({
              status: BookingStatus.DepositPaid,
              updatedAt: FieldValue.serverTimestamp()
            });
            console.log(`Booking ${payment.bookingId} updated to DepositPaid`);
          }
          
          // Remaining payment - move to FullyPaid
          if (currentStatus === BookingStatus.ResultReady && payment.remainingAmount) {
            await adminDb.collection(COLLECTIONS.testBookings).doc(payment.bookingId).update({
              status: BookingStatus.FullyPaid,
              updatedAt: FieldValue.serverTimestamp()
            });
            console.log(`Booking ${payment.bookingId} updated to FullyPaid`);
          }
        }
      }

      console.log(`Payment ${paymentDoc.id} marked as PAID`);
    } else {
      // Payment failed
      await adminDb.collection(COLLECTIONS.payments).doc(paymentDoc.id).update({
        status: PaymentStatus.Failed,
        description: `${payment.description} - Error: ${desc}`,
        updatedAt: FieldValue.serverTimestamp()
      });

      console.log(`Payment ${paymentDoc.id} marked as FAILED: ${desc}`);
    }

    // Always return 200 to acknowledge webhook
    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Webhook processed', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to prevent PayOS from retrying
    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: false }, message: 'Webhook error', statusCode: 200 },
      { status: 200 }
    );
  }
}
