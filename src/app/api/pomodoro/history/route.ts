// GET /api/pomodoro/history - Get Pomodoro session history (VIP only)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { Timestamp } from 'firebase-admin/firestore';
import type { ApiResponse } from '@/types';
import { getUserVipStatus } from '@/lib/vip';

function toIso(v: unknown): string {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (v && typeof v === 'object' && '_seconds' in (v as object)) {
    const t = v as { _seconds: number; _nanoseconds: number };
    return new Date(t._seconds * 1000 + t._nanoseconds / 1e6).toISOString();
  }
  return typeof v === 'string' ? v : new Date().toISOString();
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

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    // Fetch sessions without orderBy to avoid composite index requirement; sort client-side
    const snapshot = await adminDb
      .collection(COLLECTIONS.pomodoroSessions)
      .where('userId', '==', payload.userId)
      .limit(limit)
      .get();

    const sessions = snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      return {
        id: (data.id as string) ?? doc.id,
        userId: data.userId as string,
        duration: data.duration as number,
        subject: (data.subject as string | null) ?? null,
        completedAt: toIso(data.completedAt),
        createdAt: toIso(data.createdAt),
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json<ApiResponse<typeof sessions>>(
      { data: sessions, message: 'Lấy lịch sử Pomodoro thành công', statusCode: 200 },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/pomodoro/history error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
