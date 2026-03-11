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
  } catch (error) {
    console.error('GET /api/upgrade/benefits error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

function buildFeatureList(plan: typeof VIP_PLANS[keyof typeof VIP_PLANS]): string[] {
  const base = [
    `${plan.freeSessionsPerMonth} buổi Mentor miễn phí/tháng`,
    `Giảm ${plan.discountPercent}% khi hết buổi miễn phí`,
    'Huy hiệu VIP trên cộng đồng',
    'Ưu tiên hỗ trợ từ đội ngũ StudyHub',
    'Truy cập tất cả tài liệu học tập',
  ];
  if (plan.id === 'quarterly') {
    base.push('Tiết kiệm so với gói tháng');
  }
  if (plan.id === 'yearly') {
    base.push('Tiết kiệm nhiều nhất');
    base.push('Tặng 1 buổi Mentor miễn phí/tháng');
  }
  return base;
}
