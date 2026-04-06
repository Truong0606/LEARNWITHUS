// PATCH /api/groups/[groupId]/members/[memberId]/approve
// Mentor (group creator/admin) approves a pending join request

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { getDocument } from '@/lib/firebase/firestore';
import { FieldValue } from 'firebase-admin/firestore';
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

    // Only group creator (mentor) can approve - and group must be private
    if (group.createdBy !== mentorId) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          message: 'Chỉ mentor tạo nhóm mới có thể duyệt yêu cầu tham gia',
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
          message: 'Chỉ mentor mới có thể duyệt yêu cầu tham gia nhóm riêng tư',
          statusCode: 403,
        },
        { status: 403 }
      );
    }

    // Get member record
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
    if (member.groupId !== actualGroupId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Yêu cầu không thuộc nhóm này', statusCode: 400 },
        { status: 400 }
      );
    }

    if (member.status !== 'pending') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Yêu cầu này đã được xử lý', statusCode: 400 },
        { status: 400 }
      );
    }

    const now = FieldValue.serverTimestamp();

    // Update member status to active
    await adminDb.collection(COLLECTIONS.groupMembers).doc(memberId).update({
      status: 'active',
      updatedAt: now,
    });

    // Increment group members count
    await adminDb
      .collection(COLLECTIONS.studyGroups)
      .doc(actualGroupId)
      .update({
        membersCount: FieldValue.increment(1),
        updatedAt: now,
      });

    return NextResponse.json<ApiResponse<{ status: string }>>(
      { data: { status: 'active' }, message: 'Đã duyệt yêu cầu tham gia nhóm', statusCode: 200 },
      { status: 200 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
