// POST /api/mentor - Submit mentor request

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { generateId } from '@/lib/firebase/firestore';
import { isValidEmail } from '@/lib/utils';
import { FieldValue } from 'firebase-admin/firestore';
import type { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, subject, goal } = body;

    // Validate
    if (!fullName?.trim()) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng nhập họ tên', statusCode: 400 },
        { status: 400 }
      );
    }
    if (!email?.trim() || !isValidEmail(email)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Email không hợp lệ', statusCode: 400 },
        { status: 400 }
      );
    }
    if (!subject?.trim()) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng nhập môn học quan tâm', statusCode: 400 },
        { status: 400 }
      );
    }

    const now = FieldValue.serverTimestamp();
    const id = generateId();

    await adminDb.collection(COLLECTIONS.mentorRequests).doc(id).set({
      id,
      fullName: fullName.trim(),
      email: email.trim(),
      subject: subject.trim(),
      goal: goal?.trim() || '',
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json<ApiResponse<{ id: string }>>(
      { data: { id }, message: 'Gửi yêu cầu mentor thành công! Chúng tôi sẽ liên hệ bạn sớm.', statusCode: 201 },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/mentor error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
