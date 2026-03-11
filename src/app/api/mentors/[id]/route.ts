// GET /api/mentors/[id] - Get mentor profile by profile ID or userId

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { ApiResponse, MentorProfile, MentorReview } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function serializeDoc(data: Record<string, unknown>) {
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
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id || typeof id !== 'string' || !id.trim()) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Thiếu ID mentor', statusCode: 400 },
        { status: 400 }
      );
    }

    // Try by document ID first
    let profileDoc = await adminDb.collection(COLLECTIONS.mentorProfiles).doc(id).get();

    // If not found, try by userId
    if (!profileDoc.exists) {
      const snapshot = await adminDb
        .collection(COLLECTIONS.mentorProfiles)
        .where('userId', '==', id)
        .limit(1)
        .get();
      if (!snapshot.empty) {
        profileDoc = snapshot.docs[0];
      }
    }

    if (!profileDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy Mentor', statusCode: 404 },
        { status: 404 }
      );
    }

    const rawData = profileDoc.data() as Record<string, unknown>;
    const profile = serializeDoc(rawData) as unknown as MentorProfile;
    // Đảm bảo profile có id (document ID) - cần cho Link và booking
    (profile as unknown as Record<string, unknown>).id = rawData.id || profileDoc.id;
    // Chuẩn hóa availability thành array (có thể lưu dạng string)
    const avail = rawData.availability;
    (profile as unknown as Record<string, unknown>).availability = Array.isArray(avail)
      ? avail
      : typeof avail === 'string' && avail
        ? avail.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];

    // Fetch recent reviews (bỏ qua nếu thiếu index)
    let reviews: MentorReview[] = [];
    try {
      const reviewsSnapshot = await adminDb
        .collection(COLLECTIONS.mentorReviews)
        .where('mentorId', '==', profile.userId)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
      reviews = reviewsSnapshot.docs.map((doc) =>
        serializeDoc(doc.data() as Record<string, unknown>)
      ) as unknown as MentorReview[];
    } catch {
      // Thiếu composite index (mentorId, createdAt) - trả về profile không có reviews
    }

    return NextResponse.json<ApiResponse<{ profile: MentorProfile; reviews: MentorReview[] }>>({
      data: { profile, reviews },
      message: 'OK',
      statusCode: 200,
    });
  } catch (error) {
    console.error('GET /api/mentors/[id] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
