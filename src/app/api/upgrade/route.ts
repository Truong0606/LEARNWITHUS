// POST /api/upgrade - Táº¡o link thanh toÃ¡n PayOS Ä‘á»ƒ nÃ¢ng cáº¥p VIP
// GET  /api/upgrade - Láº¥y tráº¡ng thÃ¡i VIP hiá»‡n táº¡i cá»§a user

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { createDocument } from '@/lib/firebase/firestore';
import { createPaymentLink, generateOrderCode, getPaymentInfo } from '@/lib/payos';
import { ApiResponse, PaymentStatus, VipPlanId, VIP_PLANS, User } from '@/types';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// GET - Láº¥y tráº¡ng thÃ¡i VIP cá»§a user hiá»‡n táº¡i
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lÃ²ng Ä‘Äƒng nháº­p', statusCode: 401 },
        { status: 401 }
      );
    }

    const payload = verifyToken(authHeader.split(' ')[1]);
    if (!payload) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Token khÃ´ng há»£p lá»‡', statusCode: 401 },
        { status: 401 }
      );
    }

    const userDoc = await adminDb.collection(COLLECTIONS.users).doc(payload.userId).get();
    if (!userDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng', statusCode: 404 },
        { status: 404 }
      );
    }

    const user = userDoc.data() as User;
    const now = new Date();

    const vipExpiresAt = user.vipExpiresAt
      ? user.vipExpiresAt instanceof Timestamp
        ? (user.vipExpiresAt as unknown as Timestamp).toDate()
        : new Date(user.vipExpiresAt)
      : null;

    const isVip = !!(vipExpiresAt && vipExpiresAt > now);

    return NextResponse.json<ApiResponse<{
      isVip: boolean;
      vipPlan: VipPlanId | null;
      vipExpiresAt: string | null;
    }>>(
      {
        data: {
          isVip,
          vipPlan: isVip ? (user.vipPlan ?? null) : null,
          vipExpiresAt: vipExpiresAt ? vipExpiresAt.toISOString() : null,
        },
        message: 'OK',
        statusCode: 200,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lá»—i mÃ¡y chá»§', statusCode: 500 },
      { status: 500 }
    );
  }
}

// POST - Táº¡o link thanh toÃ¡n PayOS Ä‘á»ƒ nÃ¢ng cáº¥p VIP
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lÃ²ng Ä‘Äƒng nháº­p', statusCode: 401 },
        { status: 401 }
      );
    }

    const payload = verifyToken(authHeader.split(' ')[1]);
    if (!payload) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Token khÃ´ng há»£p lá»‡', statusCode: 401 },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId } = body as { planId: VipPlanId };

    if (!planId || !VIP_PLANS[planId]) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'GÃ³i VIP khÃ´ng há»£p lá»‡', statusCode: 400 },
        { status: 400 }
      );
    }

    const plan = VIP_PLANS[planId];

    // Kiá»ƒm tra VIP hiá»‡n táº¡i
    const userDoc = await adminDb.collection(COLLECTIONS.users).doc(payload.userId).get();
    if (!userDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'KhÃ´ng tÃ¬m tháº¥y ngÆ°á»i dÃ¹ng', statusCode: 404 },
        { status: 404 }
      );
    }

    const user = userDoc.data() as User;
    const now = new Date();
    const vipExpiresAt = user.vipExpiresAt
      ? user.vipExpiresAt instanceof Timestamp
        ? (user.vipExpiresAt as unknown as Timestamp).toDate()
        : new Date(user.vipExpiresAt)
      : null;

    if (vipExpiresAt && vipExpiresAt > now) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          message: `Báº¡n Ä‘ang cÃ³ gÃ³i VIP ${user.vipPlan} cÃ²n hiá»‡u lá»±c Ä‘áº¿n ${vipExpiresAt.toLocaleDateString('vi-VN')}`,
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    // Kiá»ƒm tra payment Ä‘ang pending Ä‘á»ƒ trÃ¡nh táº¡o trÃ¹ng
    const existingPayment = await adminDb
      .collection(COLLECTIONS.payments)
      .where('userId', '==', payload.userId)
      .where('paymentFor', '==', 'vip_upgrade')
      .where('planId', '==', planId)
      .where('status', '==', PaymentStatus.Pending)
      .limit(1)
      .get();

    if (!existingPayment.empty) {
      const existingDoc = existingPayment.docs[0];
      const existing = existingDoc.data();

      // Verify with PayOS whether the order is still active (PENDING)
      // If user cancelled it on PayOS side, our Firestore record is stale â†’ create fresh order
      let payosStillPending = false;
      try {
        const payosInfo = await getPaymentInfo(existing.orderCode as number);
        payosStillPending = payosInfo.data?.status === 'PENDING';
      } catch {
        // If PayOS check fails, treat as stale to unblock the user
        payosStillPending = false;
      }

      if (payosStillPending) {
        // Order is still open on PayOS â€” return the existing checkout URL
        return NextResponse.json<ApiResponse<{
          paymentId: string;
          checkoutUrl: string;
          orderCode: number;
          amount: number;
          planName: string;
          isExisting: boolean;
        }>>(
          {
            data: {
              paymentId: existingDoc.id,
              checkoutUrl: existing.checkoutUrl || '',
              orderCode: existing.orderCode,
              amount: existing.amount,
              planName: plan.name,
              isExisting: true,
            },
            message: 'ÄÃ£ cÃ³ yÃªu cáº§u thanh toÃ¡n Ä‘ang chá» xá»­ lÃ½',
            statusCode: 200,
          },
          { status: 200 }
        );
      }

      // Order was cancelled/expired on PayOS â€” mark our record as Cancelled and create a new one
      await existingDoc.ref.update({
        status: PaymentStatus.Cancelled,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    const orderCode = generateOrderCode();
    const description = `VIP ${plan.name} ${payload.userId.slice(-6)}`;

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim();
    const returnUrl = `${baseUrl}/payment/success?type=vip_upgrade&planId=${planId}`;
    const cancelUrl = `${baseUrl}/payment/cancel?type=vip_upgrade&planId=${planId}`;

    const payosResponse = await createPaymentLink({
      orderCode,
      amount: plan.price,
      description,
      buyerName: user.fullName || payload.userName,
      buyerEmail: user.email,
      returnUrl,
      cancelUrl,
      items: [
        {
          name: `GÃ³i VIP ${plan.name} - Learn With Us`,
          quantity: 1,
          price: plan.price,
        },
      ],
    });

    if (payosResponse.code !== '00') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: `Lá»—i táº¡o thanh toÃ¡n: ${payosResponse.desc}`, statusCode: 400 },
        { status: 400 }
      );
    }

    // LÆ°u payment vÃ o Firestore
    const paymentId = await createDocument(COLLECTIONS.payments, {
      orderCode,
      amount: plan.price,
      status: PaymentStatus.Pending,
      description,
      paymentFor: 'vip_upgrade',
      userId: payload.userId,
      planId,
      checkoutUrl: payosResponse.data?.checkoutUrl || '',
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json<ApiResponse<{
      paymentId: string;
      checkoutUrl: string;
      orderCode: number;
      amount: number;
      planName: string;
      isExisting: boolean;
    }>>(
      {
        data: {
          paymentId,
          checkoutUrl: payosResponse.data?.checkoutUrl || '',
          orderCode,
          amount: plan.price,
          planName: plan.name,
          isExisting: false,
        },
        message: 'Táº¡o link thanh toÃ¡n thÃ nh cÃ´ng',
        statusCode: 201,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lá»—i mÃ¡y chá»§', statusCode: 500 },
      { status: 500 }
    );
  }
}

