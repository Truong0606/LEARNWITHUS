// GET /api/mentor/availability - Get current mentor's availability slots
// PUT /api/mentor/availability - Update availability slots (mentor only)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { FieldValue } from 'firebase-admin/firestore';
import { UserRole } from '@/types';
import type { ApiResponse } from '@/types';

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

    const profileSnap = await adminDb
      .collection(COLLECTIONS.mentorProfiles)
      .where('userId', '==', payload.userId)
      .limit(1)
      .get();

    if (profileSnap.empty) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy hồ sơ Mentor', statusCode: 404 },
        { status: 404 }
      );
    }

    const profile = profileSnap.docs[0].data();
    const availability = Array.isArray(profile.availability)
      ? profile.availability
      : typeof profile.availability === 'string' && profile.availability
        ? profile.availability.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];

    return NextResponse.json<ApiResponse<{ availability: string[] }>>({
      data: { availability },
      message: 'OK',
      statusCode: 200,
    });
  } catch (error) {
    console.error('GET /api/mentor/availability error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    // Must be mentor role
    const userDoc = await adminDb.collection(COLLECTIONS.users).doc(payload.userId).get();
    if (!userDoc.exists || (userDoc.data() as { role: number }).role !== UserRole.Mentor) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Chỉ Mentor mới có quyền cập nhật lịch', statusCode: 403 },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { availability } = body as { availability: string[] };

    if (!Array.isArray(availability)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Dữ liệu lịch rảnh không hợp lệ', statusCode: 400 },
        { status: 400 }
      );
    }

    const cleaned = availability.map((s: string) => s.trim()).filter(Boolean);

    const profileSnap = await adminDb
      .collection(COLLECTIONS.mentorProfiles)
      .where('userId', '==', payload.userId)
      .limit(1)
      .get();

    if (profileSnap.empty) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy hồ sơ Mentor', statusCode: 404 },
        { status: 404 }
      );
    }

    await profileSnap.docs[0].ref.update({
      availability: cleaned,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json<ApiResponse<{ availability: string[] }>>({
      data: { availability: cleaned },
      message: 'Cập nhật lịch rảnh thành công',
      statusCode: 200,
    });
  } catch (error) {
    console.error('PUT /api/mentor/availability error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
