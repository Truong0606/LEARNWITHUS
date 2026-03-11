// GET /api/mentor/stats - Get detailed stats for the authenticated mentor

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { Timestamp } from 'firebase-admin/firestore';
import { UserRole } from '@/types';
import type { ApiResponse, MentorEarning } from '@/types';

function toStr(v: unknown): string {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (v && typeof v === 'object' && '_seconds' in (v as object)) {
    const t = v as { _seconds: number; _nanoseconds: number };
    return new Date(t._seconds * 1000 + t._nanoseconds / 1e6).toISOString();
  }
  return typeof v === 'string' ? v : '';
}

export async function GET(request: NextRequest) {
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

    // Must be a mentor
    const userDoc = await adminDb.collection(COLLECTIONS.users).doc(payload.userId).get();
    if (!userDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy người dùng', statusCode: 404 },
        { status: 404 }
      );
    }
    const user = userDoc.data() as { role: number };
    if (user.role !== UserRole.Mentor) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Chỉ Mentor mới có quyền xem thống kê này', statusCode: 403 },
        { status: 403 }
      );
    }

    // Fetch all bookings for this mentor
    const bookingsSnap = await adminDb
      .collection(COLLECTIONS.mentorBookings)
      .where('mentorId', '==', payload.userId)
      .limit(1000)
      .get();

    const allBookings = bookingsSnap.docs.map((doc) => {
      const d = doc.data() as Record<string, unknown>;
      return {
        id: doc.id,
        userId: (d.userId as string) || '',
        type: (d.type as string) || 'session',
        amount: (d.amount as number) || 0,
        status: (d.status as string) || '',
        scheduledAt: toStr(d.scheduledAt),
        completedAt: d.completedAt ? toStr(d.completedAt) : undefined,
        topic: (d.topic as string) || '',
        userName: (d.userName as string) || '',
        mentorPaid: Boolean(d.mentorPaid),
        mentorPaidAt: d.mentorPaidAt ? toStr(d.mentorPaidAt) : undefined,
        isFreeVipSession: Boolean(d.isFreeVipSession),
        reviewId: d.reviewId as string | undefined,
      };
    });

    const completedBookings = allBookings.filter((b) => b.status === 'completed');
    const cancelledBookings = allBookings.filter((b) => b.status === 'cancelled');
    const pendingBookings = allBookings.filter((b) => ['pending', 'paid', 'confirmed'].includes(b.status));

    // Earnings breakdown
    const MENTOR_RATE = 0.8;
    const earnings: MentorEarning[] = completedBookings.map((b) => ({
      bookingId: b.id,
      mentorId: payload.userId,
      userId: b.userId,
      userName: b.userName,
      topic: b.topic,
      type: b.type as 'session' | 'consultation',
      amount: b.amount,
      mentorAmount: b.isFreeVipSession ? 0 : Math.round(b.amount * MENTOR_RATE),
      platformFee: b.isFreeVipSession ? 0 : Math.round(b.amount * (1 - MENTOR_RATE)),
      isFreeVipSession: b.isFreeVipSession,
      scheduledAt: b.scheduledAt,
      completedAt: b.completedAt,
      mentorPaid: b.mentorPaid,
      mentorPaidAt: b.mentorPaidAt,
    }));

    const totalEarnings = earnings.reduce((sum, e) => sum + e.mentorAmount, 0);
    const paidEarnings = earnings.filter((e) => e.mentorPaid).reduce((sum, e) => sum + e.mentorAmount, 0);
    const pendingEarnings = earnings.filter((e) => !e.mentorPaid).reduce((sum, e) => sum + e.mentorAmount, 0);

    // Monthly revenue for chart (last 6 months)
    const now = new Date();
    const monthlyData: Array<{ month: string; label: string; sessions: number; earnings: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
      const monthBookings = completedBookings.filter((b) => {
        const bd = new Date(b.scheduledAt);
        return `${bd.getFullYear()}-${String(bd.getMonth() + 1).padStart(2, '0')}` === key;
      });
      monthlyData.push({
        month: key,
        label,
        sessions: monthBookings.length,
        earnings: monthBookings.reduce((sum, b) => sum + (b.isFreeVipSession ? 0 : Math.round(b.amount * MENTOR_RATE)), 0),
      });
    }

    // Reviews fetch
    let avgRating = 0;
    let reviewCount = 0;
    const profileSnap = await adminDb
      .collection(COLLECTIONS.mentorProfiles)
      .where('userId', '==', payload.userId)
      .limit(1)
      .get();
    if (!profileSnap.empty) {
      const p = profileSnap.docs[0].data();
      avgRating = (p.rating as number) || 0;
      reviewCount = (p.reviewCount as number) || 0;
    }

    // Unique mentees
    const uniqueMenteeIds = new Set(completedBookings.map((b) => b.userId));

    return NextResponse.json<ApiResponse<{
      overview: {
        totalSessions: number;
        completedSessions: number;
        cancelledSessions: number;
        pendingSessions: number;
        uniqueMentees: number;
        avgRating: number;
        reviewCount: number;
      };
      financials: {
        totalEarnings: number;
        paidEarnings: number;
        pendingEarnings: number;
        sessionRate: number; // percent
      };
      monthlyData: typeof monthlyData;
      recentEarnings: MentorEarning[];
    }>>({
      data: {
        overview: {
          totalSessions: allBookings.length,
          completedSessions: completedBookings.length,
          cancelledSessions: cancelledBookings.length,
          pendingSessions: pendingBookings.length,
          uniqueMentees: uniqueMenteeIds.size,
          avgRating,
          reviewCount,
        },
        financials: {
          totalEarnings,
          paidEarnings,
          pendingEarnings,
          sessionRate: 80,
        },
        monthlyData,
        recentEarnings: earnings.slice(0, 20),
      },
      message: 'OK',
      statusCode: 200,
    });
  } catch (error) {
    console.error('GET /api/mentor/stats error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
