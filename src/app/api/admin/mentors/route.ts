// GET /api/admin/mentors - List all mentor profiles (Admin only)
// PATCH /api/admin/mentors/[id] - Update mentor profile (Admin only)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { ApiResponse, MentorProfile } from '@/types';

function serializeProfile(data: Record<string, unknown>): MentorProfile {
  const toStr = (v: unknown): string => {
    if (v instanceof Timestamp) return v.toDate().toISOString();
    if (v && typeof v === 'object' && '_seconds' in (v as object)) {
      const t = v as { _seconds: number; _nanoseconds: number };
      return new Date(t._seconds * 1000 + t._nanoseconds / 1e6).toISOString();
    }
    return typeof v === 'string' ? v : '';
  };
  return {
    ...data,
    createdAt: toStr(data.createdAt),
    updatedAt: data.updatedAt ? toStr(data.updatedAt) : undefined,
  } as unknown as MentorProfile;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Unauthorized', statusCode: 401 },
        { status: 401 }
      );
    }
    const payload = verifyToken(authHeader.split(' ')[1]);
    if (!payload || payload.role !== 'Admin') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Chỉ Admin mới có quyền xem danh sách Mentor', statusCode: 403 },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const isActiveFilter = searchParams.get('isActive');

    let query: FirebaseFirestore.Query = adminDb.collection(COLLECTIONS.mentorProfiles);
    if (isActiveFilter !== null) {
      query = query.where('isActive', '==', isActiveFilter === 'true');
    }

    const snapshot = await query.limit(200).get();
    const profiles = snapshot.docs.map((doc) =>
      serializeProfile({ ...doc.data(), id: doc.id } as Record<string, unknown>)
    );

    // Sort by rating desc
    profiles.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

    return NextResponse.json<ApiResponse<MentorProfile[]>>({
      data: profiles,
      message: 'OK',
      statusCode: 200,
    });
  } catch (error) {
    console.error('GET /api/admin/mentors error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Unauthorized', statusCode: 401 },
        { status: 401 }
      );
    }
    const payload = verifyToken(authHeader.split(' ')[1]);
    if (!payload || payload.role !== 'Admin') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Chỉ Admin mới có quyền cập nhật hồ sơ Mentor', statusCode: 403 },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { profileId, ...updates } = body as { profileId: string } & Record<string, unknown>;

    if (!profileId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Thiếu profileId', statusCode: 400 },
        { status: 400 }
      );
    }

    const profileRef = adminDb.collection(COLLECTIONS.mentorProfiles).doc(profileId);
    const profileDoc = await profileRef.get();
    if (!profileDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy hồ sơ Mentor', statusCode: 404 },
        { status: 404 }
      );
    }

    const allowedFields = [
      'fullName', 'phone', 'subject', 'subjects', 'experience',
      'availability', 'pricePerSession', 'bio', 'company', 'university',
      'title', 'bankName', 'bankAccountNumber', 'isActive',
    ];
    const safeUpdates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        safeUpdates[field] = updates[field];
      }
    }

    await profileRef.update(safeUpdates);
    const updated = await profileRef.get();
    const result = serializeProfile({ ...updated.data(), id: profileId } as Record<string, unknown>);

    return NextResponse.json<ApiResponse<MentorProfile>>({
      data: result,
      message: 'Cập nhật hồ sơ Mentor thành công',
      statusCode: 200,
    });
  } catch (error) {
    console.error('PATCH /api/admin/mentors error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
