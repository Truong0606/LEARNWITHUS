// GET /api/mentors/[id] - Get mentor profile by profile ID or userId

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { ApiResponse, MentorProfile, MentorReview, MentorCourse } from '@/types';

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

    const userId = profile.userId;

    // Fetch reviews + courses in parallel
    const [reviewsResult, coursesSnapshot] = await Promise.all([
      adminDb
        .collection(COLLECTIONS.mentorReviews)
        .where('mentorId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get()
        .then((snap) =>
          snap.docs.map((doc) =>
            serializeDoc(doc.data() as Record<string, unknown>)
          ) as unknown as MentorReview[]
        )
        .catch(() => [] as MentorReview[]),
      adminDb
        .collection(COLLECTIONS.mentorCourses)
        .where('mentorId', '==', userId)
        .where('isActive', '==', true)
        .limit(100)
        .get()
        .catch(() => ({ docs: [] })),
    ]);

    const courses: MentorCourse[] = coursesSnapshot.docs
      ? coursesSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            ...data,
            id: data.id ?? doc.id,
            createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? '',
            updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? '',
          } as MentorCourse;
        })
      : [];

    const res = NextResponse.json<
      ApiResponse<{ profile: MentorProfile; reviews: MentorReview[]; courses: MentorCourse[] }>
    >({
      data: { profile, reviews: reviewsResult, courses },
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
