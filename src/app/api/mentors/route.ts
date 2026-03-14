// GET /api/mentors - List active mentor profiles (public)
// PUT /api/mentors - Update own mentor profile (mentor only)

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
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 100);

    // Lấy mentor profiles (không dùng orderBy để tránh composite index)
    let snapshot;
    try {
      snapshot = await adminDb
        .collection(COLLECTIONS.mentorProfiles)
        .where('isActive', '==', true)
        .limit(limit)
        .get();
    } catch {
      // Lấy tất cả rồi lọc nếu query lỗi (thiếu index)
      snapshot = await adminDb
        .collection(COLLECTIONS.mentorProfiles)
        .limit(limit)
        .get();
    }

    let profiles = snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      // Luôn dùng doc.id (Firestore document ID) để link chi tiết hoạt động
      const profileData = { ...data, id: doc.id };
      return serializeProfile(profileData);
    });

    // Lọc isActive (hỗ trợ boolean và string)
    profiles = profiles.filter((p) => {
      const active = (p as unknown as Record<string, unknown>).isActive;
      return active === true || active === 'true';
    });

    // Sắp xếp theo rating giảm dần
    profiles.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

    if (subject) {
      const subjectLower = subject.toLowerCase();
      profiles = profiles.filter(
        (p) =>
          p.subject.toLowerCase().includes(subjectLower) ||
          p.subjects.some((s) => s.toLowerCase().includes(subjectLower))
      );
    }

    if (search) {
      const q = search.toLowerCase();
      profiles = profiles.filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.subject.toLowerCase().includes(q) ||
          p.subjects.some((s) => s.toLowerCase().includes(q)) ||
          (p.bio && p.bio.toLowerCase().includes(q))
      );
    }

    const res = NextResponse.json<ApiResponse<MentorProfile[]>>({
      data: profiles,
      message: 'OK',
      statusCode: 200,
    });
    res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return res;
  } catch {
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

    // Find mentor profile by userId
    const profileSnapshot = await adminDb
      .collection(COLLECTIONS.mentorProfiles)
      .where('userId', '==', payload.userId)
      .limit(1)
      .get();

    if (profileSnapshot.empty) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy hồ sơ Mentor', statusCode: 404 },
        { status: 404 }
      );
    }

    const profileDoc = profileSnapshot.docs[0];
    const body = await request.json();
    const allowedFields = [
      'fullName', 'phone', 'subject', 'subjects', 'experience',
      'availability', 'pricePerSession', 'bio', 'company', 'university', 'title',
      'bankName', 'bankAccountNumber',
    ];

    const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    await profileDoc.ref.update(updates);

    const updated = await profileDoc.ref.get();
    const result = serializeProfile(updated.data() as Record<string, unknown>);

    return NextResponse.json<ApiResponse<MentorProfile>>({
      data: result,
      message: 'Cập nhật hồ sơ thành công',
      statusCode: 200,
    });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
