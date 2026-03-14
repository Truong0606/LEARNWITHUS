// POST /api/pomodoro/session - Save a completed Pomodoro session
// Auth required; saves to Firestore for VIP stats

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { generateId } from '@/lib/firebase/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import type { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { duration, subject, completedAt } = body as {
      duration: number;
      subject?: string;
      completedAt?: string;
    };

    if (!duration || duration <= 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Thời lượng không hợp lệ', statusCode: 400 },
        { status: 400 }
      );
    }

    const id = generateId();
    const now = FieldValue.serverTimestamp();

    await adminDb.collection(COLLECTIONS.pomodoroSessions).doc(id).set({
      id,
      userId: payload.userId,
      duration: Math.min(duration, 120), // cap at 120 minutes
      subject: subject?.trim() || null,
      completedAt: completedAt ? new Date(completedAt).toISOString() : new Date().toISOString(),
      createdAt: now,
    });

    return NextResponse.json<ApiResponse<{ id: string }>>(
      { data: { id }, message: 'Đã lưu phiên Pomodoro', statusCode: 201 },
      { status: 201 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
