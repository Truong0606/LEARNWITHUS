// GET /api/upgrade/benefits - Get VIP benefits and current user's VIP session usage

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { VIP_PLANS, VipPlanId } from '@/types';
import { getVipStatusFromUser, currentMonthKey } from '@/lib/vip';
import { Timestamp } from 'firebase-admin/firestore';
import type { ApiResponse, User } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    // Public endpoint: plans are returned even without auth
    // Auth is optional: if provided, include user's usage stats
    let userId: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      const payload = verifyToken(authHeader.split(' ')[1]);
      if (payload) userId = payload.userId;
    }

    // Build public plan benefits info
    const plans = Object.values(VIP_PLANS).map((plan) => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      durationDays: plan.durationDays,
      freeSessionsPerMonth: plan.freeSessionsPerMonth,
      discountPercent: plan.discountPercent,
      features: buildFeatureList(plan),
    }));

    if (!userId) {
      return NextResponse.json<ApiResponse<{
        plans: typeof plans;
        currentUsage: null;
      }>>({
        data: { plans, currentUsage: null },
        message: 'OK',
        statusCode: 200,
      });
    }

    // Fetch user VIP usage
    const userDoc = await adminDb.collection(COLLECTIONS.users).doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json<ApiResponse<{
        plans: typeof plans;
        currentUsage: null;
      }>>({
        data: { plans, currentUsage: null },
        message: 'OK',
        statusCode: 200,
      });
    }

    const user = userDoc.data() as User & {
      vipExpiresAt?: Timestamp | Date;
      vipFreeSessionsMonthKey?: string;
      vipFreeSessionsUsed?: number;
    };

    const vipStatus = getVipStatusFromUser(user as User);
    const monthKey = currentMonthKey();
    const freeSessionsUsed = user.vipFreeSessionsMonthKey === monthKey
      ? (user.vipFreeSessionsUsed ?? 0)
      : 0;

    const planDetails = vipStatus.isVip && vipStatus.vipPlan
      ? VIP_PLANS[vipStatus.vipPlan as VipPlanId]
      : null;

    const freeSessionsLeft = planDetails
      ? Math.max(0, planDetails.freeSessionsPerMonth - freeSessionsUsed)
      : 0;

    return NextResponse.json<ApiResponse<{
      plans: typeof plans;
      currentUsage: {
        isVip: boolean;
        vipPlan: string | null;
        vipExpiresAt: string | null;
        freeSessionsPerMonth: number;
        freeSessionsUsed: number;
        freeSessionsLeft: number;
        discountPercent: number;
      };
    }>>({
      data: {
        plans,
        currentUsage: {
          isVip: vipStatus.isVip,
          vipPlan: vipStatus.vipPlan,
          vipExpiresAt: vipStatus.vipExpiresAt ? vipStatus.vipExpiresAt.toISOString() : null,
          freeSessionsPerMonth: planDetails?.freeSessionsPerMonth ?? 0,
          freeSessionsUsed,
          freeSessionsLeft,
          discountPercent: planDetails?.discountPercent ?? 0,
        },
      },
      message: 'OK',
      statusCode: 200,
    });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lá»—i mÃ¡y chá»§', statusCode: 500 },
      { status: 500 }
    );
  }
}

function buildFeatureList(plan: typeof VIP_PLANS[keyof typeof VIP_PLANS]): string[] {
  const base = [
    `${plan.freeSessionsPerMonth} buá»•i Mentor miá»…n phÃ­/thÃ¡ng`,
    `Giáº£m ${plan.discountPercent}% khi háº¿t buá»•i miá»…n phÃ­`,
    'Huy hiá»‡u VIP trÃªn cá»™ng Ä‘á»“ng',
    'Æ¯u tiÃªn há»— trá»£ tá»« Ä‘á»™i ngÅ© Learn With Us',
    'Truy cáº­p táº¥t cáº£ tÃ i liá»‡u há»c táº­p',
  ];
  if (plan.id === 'quarterly') {
    base.push('Tiáº¿t kiá»‡m so vá»›i gÃ³i thÃ¡ng');
  }
  if (plan.id === 'yearly') {
    base.push('Tiáº¿t kiá»‡m nhiá»u nháº¥t');
    base.push('Táº·ng 1 buá»•i Mentor miá»…n phÃ­/thÃ¡ng');
  }
  return base;
}

