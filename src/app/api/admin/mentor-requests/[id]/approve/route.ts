// PATCH /api/admin/mentor-requests/[id]/approve - Approve mentor request (Admin only)
// Sets user.role = Mentor and creates a MentorProfile

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { generateId } from '@/lib/firebase/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import type { ApiResponse } from '@/types';
import { UserRole } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Unauthorized', statusCode: 401 },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Token không hợp lệ', statusCode: 401 },
        { status: 401 }
      );
    }

    if (payload.role !== 'Admin') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Chỉ Admin mới có quyền duyệt yêu cầu Mentor', statusCode: 403 },
        { status: 403 }
      );
    }

    const requestDoc = await adminDb
      .collection(COLLECTIONS.mentorRequests)
      .doc(id)
      .get();

    if (!requestDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy yêu cầu Mentor', statusCode: 404 },
        { status: 404 }
      );
    }

    const mentorRequest = requestDoc.data() as Record<string, unknown>;
    if (mentorRequest.status !== 'pending') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Yêu cầu này đã được xử lý', statusCode: 400 },
        { status: 400 }
      );
    }

    let userId: string | null = (mentorRequest.userId as string) ?? null;

    if (!userId) {
      const usersSnapshot = await adminDb
        .collection(COLLECTIONS.users)
        .where('email', '==', (mentorRequest.email as string).toLowerCase())
        .limit(1)
        .get();

      if (usersSnapshot.empty) {
        return NextResponse.json<ApiResponse<null>>(
          {
            data: null,
            message: 'Không tìm thấy tài khoản với email này. Người dùng cần đăng ký trước.',
            statusCode: 400,
          },
          { status: 400 }
        );
      }
      userId = usersSnapshot.docs[0].id;
    }

    const now = FieldValue.serverTimestamp();

    // Get user info for profile
    const userDoc = await adminDb.collection(COLLECTIONS.users).doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    // Parse availability string into array
    const availabilityStr = (mentorRequest.availability as string) || '';
    const availabilityArr = availabilityStr
      ? availabilityStr.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    // Create mentor profile
    const profileId = generateId();
    const pricePerSession = (mentorRequest.pricePerSession as number) || 150000;

    await adminDb.collection(COLLECTIONS.mentorProfiles).doc(profileId).set({
      id: profileId,
      userId,
      fullName: (mentorRequest.fullName as string) || (userData?.fullName as string) || '',
      email: (mentorRequest.email as string) || (userData?.email as string) || '',
      phone: (mentorRequest.phone as string) || (userData?.phone as string) || '',
      subject: (mentorRequest.subject as string) || '',
      subjects: [(mentorRequest.subject as string) || ''].filter(Boolean),
      experience: (mentorRequest.experience as string) || '',
      availability: availabilityArr,
      pricePerSession,
      bio: (mentorRequest.bio as string) || (mentorRequest.goal as string) || '',
      avatarUrl: (userData?.avatarUrl as string) || '',
      bankName: (mentorRequest.bankName as string) || '',
      bankAccountNumber: (mentorRequest.bankAccountNumber as string) || '',
      company: '',
      university: '',
      title: '',
      rating: 0,
      reviewCount: 0,
      sessionCount: 0,
      menteeCount: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    // Update user role to Mentor
    await adminDb.collection(COLLECTIONS.users).doc(userId).update({
      role: UserRole.Mentor,
      updatedAt: now,
    });

    // Update mentor request status
    await adminDb.collection(COLLECTIONS.mentorRequests).doc(id).update({
      status: 'approved',
      approvedBy: payload.userId,
      approvedAt: now,
      updatedAt: now,
    });

    return NextResponse.json<ApiResponse<{ userId: string; profileId: string }>>(
      { data: { userId, profileId }, message: 'Đã duyệt yêu cầu Mentor thành công', statusCode: 200 },
      { status: 200 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
