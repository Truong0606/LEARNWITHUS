// POST /api/mentor-reviews - Submit a review for a completed mentor booking
// GET /api/mentor-reviews?mentorId=xxx - Get reviews for a mentor

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { generateId } from '@/lib/firebase/firestore';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { ApiResponse } from '@/types';

function serializeReview(data: Record<string, unknown>) {
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mentorId = searchParams.get('mentorId');

    if (!mentorId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Thiếu mentorId', statusCode: 400 },
        { status: 400 }
      );
    }

    const snapshot = await adminDb
      .collection(COLLECTIONS.mentorReviews)
      .where('mentorId', '==', mentorId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const reviews = snapshot.docs.map((doc) =>
      serializeReview(doc.data() as Record<string, unknown>)
    );

    return NextResponse.json<ApiResponse<typeof reviews>>({
      data: reviews,
      message: 'OK',
      statusCode: 200,
    });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

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
    const { mentorId, bookingId, rating, comment } = body;

    if (!mentorId || !bookingId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Thiếu thông tin', statusCode: 400 },
        { status: 400 }
      );
    }
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Điểm đánh giá phải từ 1-5', statusCode: 400 },
        { status: 400 }
      );
    }
    if (!comment?.trim()) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng nhập nhận xét', statusCode: 400 },
        { status: 400 }
      );
    }

    // Verify booking exists, belongs to user, and is completed
    const bookingDoc = await adminDb.collection(COLLECTIONS.mentorBookings).doc(bookingId).get();
    if (!bookingDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy đơn đặt lịch', statusCode: 404 },
        { status: 404 }
      );
    }

    const booking = bookingDoc.data() as { userId: string; mentorId: string; status: string; reviewId?: string };
    if (booking.userId !== payload.userId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Bạn không có quyền đánh giá đơn này', statusCode: 403 },
        { status: 403 }
      );
    }
    if (booking.status !== 'completed') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Chỉ có thể đánh giá sau khi buổi học hoàn thành', statusCode: 400 },
        { status: 400 }
      );
    }
    if (booking.reviewId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Bạn đã đánh giá buổi học này rồi', statusCode: 400 },
        { status: 400 }
      );
    }

    const id = generateId();
    const now = FieldValue.serverTimestamp();

    await adminDb.collection(COLLECTIONS.mentorReviews).doc(id).set({
      id,
      mentorId: booking.mentorId,
      userId: payload.userId,
      bookingId,
      rating: Math.round(rating),
      comment: comment.trim(),
      userName: payload.userName,
      createdAt: now,
      updatedAt: now,
    });

    // Link review to booking
    await adminDb.collection(COLLECTIONS.mentorBookings).doc(bookingId).update({
      reviewId: id,
      updatedAt: now,
    });

    // Update mentor profile rating
    const profileSnap = await adminDb
      .collection(COLLECTIONS.mentorProfiles)
      .where('userId', '==', booking.mentorId)
      .limit(1)
      .get();

    if (!profileSnap.empty) {
      const profileRef = profileSnap.docs[0].ref;
      const profileData = profileSnap.docs[0].data();
      const currentRating = (profileData.rating as number) || 0;
      const currentCount = (profileData.reviewCount as number) || 0;
      const newCount = currentCount + 1;
      const newRating = ((currentRating * currentCount) + Math.round(rating)) / newCount;

      await profileRef.update({
        rating: Math.round(newRating * 10) / 10,
        reviewCount: newCount,
        menteeCount: FieldValue.increment(0),
        updatedAt: now,
      });

      // Update unique mentee count
      const uniqueMentees = await adminDb
        .collection(COLLECTIONS.mentorBookings)
        .where('mentorId', '==', booking.mentorId)
        .where('status', '==', 'completed')
        .get();
      const uniqueUserIds = new Set(uniqueMentees.docs.map((d) => (d.data() as { userId: string }).userId));
      await profileRef.update({ menteeCount: uniqueUserIds.size });
    }

    return NextResponse.json<ApiResponse<{ id: string }>>(
      { data: { id }, message: 'Đánh giá thành công! Cảm ơn bạn.', statusCode: 201 },
      { status: 201 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
