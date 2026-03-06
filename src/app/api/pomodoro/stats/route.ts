// GET /api/pomodoro/stats - Pomodoro statistics for VIP users

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { Timestamp } from 'firebase-admin/firestore';
import type { ApiResponse } from '@/types';
import { getUserVipStatus } from '@/lib/vip';

function toDate(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate();
  if (v && typeof v === 'object' && '_seconds' in (v as object)) {
    const t = v as { _seconds: number; _nanoseconds: number };
    return new Date(t._seconds * 1000 + t._nanoseconds / 1e6);
  }
  return new Date(typeof v === 'string' ? v : Date.now());
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

    // VIP only
    const { isVip } = await getUserVipStatus(payload.userId);
    if (!isVip) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Tính năng dành riêng cho thành viên VIP', statusCode: 403 },
        { status: 403 }
      );
    }

    // Fetch all sessions for user (no orderBy to avoid composite index requirement)
    const snapshot = await adminDb
      .collection(COLLECTIONS.pomodoroSessions)
      .where('userId', '==', payload.userId)
      .limit(500)
      .get();

    const sessions = snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      return {
        duration: (data.duration as number) || 25,
        completedAt: toDate(data.completedAt ?? data.createdAt),
        subject: (data.subject as string | null) ?? null,
      };
    });

    // Totals
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);

    // Streak: count consecutive days ending today (local date)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daySet = new Set(
      sessions.map((s) => {
        const d = new Date(s.completedAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    );
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      if (daySet.has(day.getTime())) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // Weekly chart: last 7 days, sessions per day
    const weeklyData: { date: string; sessions: number; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const daySessions = sessions.filter((s) => s.completedAt >= day && s.completedAt <= dayEnd);
      weeklyData.push({
        date: day.toLocaleDateString('vi-VN', { weekday: 'short', month: 'numeric', day: 'numeric' }),
        sessions: daySessions.length,
        minutes: daySessions.reduce((sum, s) => sum + s.duration, 0),
      });
    }

    // Monthly chart: last 4 weeks, sessions per week
    const monthlyData: { week: string; sessions: number; minutes: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - i * 7 - 6);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekSessions = sessions.filter((s) => s.completedAt >= weekStart && s.completedAt <= weekEnd);
      monthlyData.push({
        week: `${weekStart.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })} - ${weekEnd.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}`,
        sessions: weekSessions.length,
        minutes: weekSessions.reduce((sum, s) => sum + s.duration, 0),
      });
    }

    // Subject breakdown (top 5)
    const subjectMap: Record<string, number> = {};
    sessions.forEach((s) => {
      const key = s.subject || 'Không xác định';
      subjectMap[key] = (subjectMap[key] || 0) + 1;
    });
    const subjectBreakdown = Object.entries(subjectMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([subject, count]) => ({ subject, count }));

    const stats = {
      totalSessions,
      totalMinutes,
      streak,
      weeklyData,
      monthlyData,
      subjectBreakdown,
    };

    return NextResponse.json<ApiResponse<typeof stats>>(
      { data: stats, message: 'Thống kê Pomodoro', statusCode: 200 },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/pomodoro/stats error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
