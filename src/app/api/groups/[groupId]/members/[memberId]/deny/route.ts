// PATCH /api/groups/[groupId]/members/[memberId]/deny
// Mentor (group creator) denies a pending join request

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { getDocument } from '@/lib/firebase/firestore';
import type { ApiResponse, StudyGroup, GroupMember } from '@/types';
import { User, UserRole } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; memberId: string }> }
) {
  try {
    const { groupId, memberId } = await params;

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng đăng nhập', statusCode: 401 },
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

    const mentorId = payload.userId;

    // Get group
    const group = await getDocument<StudyGroup>(COLLECTIONS.studyGroups, groupId);

    if (!group) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy nhóm học', statusCode: 404 },
        { status: 404 }
      );
    }
    const actualGroupId = group.id;

    if (group.createdBy !== mentorId) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          message: 'Chỉ mentor tạo nhóm mới có thể từ chối yêu cầu tham gia',
          statusCode: 403,
        },
        { status: 403 }
      );
    }

    if (!group.isPrivate) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          message: 'Nhóm công khai không cần duyệt tham gia',
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    // Verify requester is Mentor
    const userDoc = await adminDb.collection(COLLECTIONS.users).doc(mentorId).get();
    if (!userDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy người dùng', statusCode: 404 },
        { status: 404 }
      );
    }
    const user = userDoc.data() as User;
    if (user.role !== UserRole.Mentor) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          message: 'Chỉ mentor mới có thể từ chối yêu cầu tham gia nhóm riêng tư',
          statusCode: 403,
        },
        { status: 403 }
      );
    }

    const memberDoc = await adminDb
      .collection(COLLECTIONS.groupMembers)
      .doc(memberId)
      .get();

    if (!memberDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy yêu cầu tham gia', statusCode: 404 },
        { status: 404 }
      );
    }

    const member = memberDoc.data() as GroupMember;
    if (member.groupId !== actualGroupId || member.status !== 'pending') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Yêu cầu không hợp lệ hoặc đã được xử lý', statusCode: 400 },
        { status: 400 }
      );
    }

    // Delete the pending membership (user can request again later)
    await adminDb.collection(COLLECTIONS.groupMembers).doc(memberId).delete();

    return NextResponse.json<ApiResponse<{ status: string }>>(
      { data: { status: 'denied' }, message: 'Đã từ chối yêu cầu tham gia nhóm', statusCode: 200 },
      { status: 200 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
