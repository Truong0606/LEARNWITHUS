// GET /api/mentor-courses?mentorId=xxx - List courses for a mentor
// POST /api/mentor-courses - Create a course (mentor only)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { generateId } from '@/lib/firebase/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import type { ApiResponse, MentorCourse, UserRole } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mentorId = searchParams.get('mentorId');

    let query: FirebaseFirestore.Query = adminDb.collection(COLLECTIONS.mentorCourses);

    if (mentorId) {
      query = query.where('mentorId', '==', mentorId);
    }

    query = query.where('isActive', '==', true);

    const snapshot = await query.limit(100).get();
    const courses = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: data.id ?? doc.id,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? '',
        updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? '',
      } as MentorCourse;
    });

    return NextResponse.json<ApiResponse<MentorCourse[]>>({
      data: courses,
      message: 'Lấy danh sách khóa học thành công',
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

    // Verify user is a mentor
    const userDoc = await adminDb.collection(COLLECTIONS.users).doc(payload.userId).get();
    const userData = userDoc.data() as { role?: number } | undefined;
    if (!userData || userData.role !== (4 as unknown as UserRole)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Bạn không phải Mentor', statusCode: 403 },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, subject, price, duration, maxStudents, level } = body;

    if (!title?.trim()) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng nhập tên khóa học', statusCode: 400 },
        { status: 400 }
      );
    }
    if (!description?.trim()) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng nhập mô tả khóa học', statusCode: 400 },
        { status: 400 }
      );
    }
    if (!subject?.trim()) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng chọn môn học', statusCode: 400 },
        { status: 400 }
      );
    }
    const priceNum = typeof price === 'number' ? price : parseInt(String(price || 0), 10);
    if (isNaN(priceNum) || priceNum < 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Giá khóa học không hợp lệ', statusCode: 400 },
        { status: 400 }
      );
    }
    if (!duration?.trim()) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng nhập thời lượng khóa học', statusCode: 400 },
        { status: 400 }
      );
    }
    const validLevels = ['beginner', 'intermediate', 'advanced'];
    if (!level || !validLevels.includes(level)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng chọn trình độ', statusCode: 400 },
        { status: 400 }
      );
    }

    // Get mentor name
    const profileSnap = await adminDb
      .collection(COLLECTIONS.mentorProfiles)
      .where('userId', '==', payload.userId)
      .limit(1)
      .get();
    const mentorName = profileSnap.empty
      ? payload.userName || ''
      : (profileSnap.docs[0].data() as { fullName?: string }).fullName || '';

    const id = generateId();
    const now = FieldValue.serverTimestamp();

    await adminDb.collection(COLLECTIONS.mentorCourses).doc(id).set({
      id,
      mentorId: payload.userId,
      mentorName,
      title: title.trim(),
      description: description.trim(),
      subject: subject.trim(),
      price: priceNum,
      duration: duration.trim(),
      maxStudents: maxStudents ? parseInt(String(maxStudents), 10) : null,
      level,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json<ApiResponse<{ id: string }>>(
      { data: { id }, message: 'Tạo khóa học thành công', statusCode: 201 },
      { status: 201 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
