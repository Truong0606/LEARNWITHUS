// GET /api/groups/[groupId]/pending-members
// List pending join requests for a private group (Mentor/group creator only)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { getDocument } from '@/lib/firebase/firestore';
import type { ApiResponse, StudyGroup, GroupMember } from '@/types';
import { User, UserRole } from '@/types';

export interface PendingMemberInfo {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  joinedAt: Date;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;

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
          message: 'Chỉ mentor tạo nhóm mới có thể xem yêu cầu tham gia',
          statusCode: 403,
        },
        { status: 403 }
      );
    }

    if (!group.isPrivate) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          message: 'Nhóm công khai không có yêu cầu chờ duyệt',
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    const userDoc = await adminDb.collection(COLLECTIONS.users).doc(mentorId).get();
    if (!userDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy người dùng', statusCode: 404 },
        { status: 404 }
      );
    }
    const mentorUser = userDoc.data() as User;
    if (mentorUser.role !== UserRole.Mentor) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          message: 'Chỉ mentor mới có thể xem yêu cầu tham gia nhóm riêng tư',
          statusCode: 403,
        },
        { status: 403 }
      );
    }

    const pendingSnapshot = await adminDb
      .collection(COLLECTIONS.groupMembers)
      .where('groupId', '==', actualGroupId)
      .where('status', '==', 'pending')
      .get();

    const members = pendingSnapshot.docs.map((d) => d.data() as GroupMember);
    const userIds = [...new Set(members.map((m) => m.userId))];

    const userMap: Record<string, User> = {};
    await Promise.all(
      userIds.map(async (uid) => {
        const doc = await adminDb.collection(COLLECTIONS.users).doc(uid).get();
        if (doc.exists) {
          userMap[uid] = doc.data() as User;
        }
      })
    );

    const result: PendingMemberInfo[] = members.map((m) => {
      const u = userMap[m.userId];
      const joinedAt = m.joinedAt instanceof Date
        ? m.joinedAt
        : (m.joinedAt as FirebaseFirestore.Timestamp)?.toDate?.() ?? new Date();
      return {
        id: m.id,
        userId: m.userId,
        userName: u?.fullName ?? 'Ẩn danh',
        userEmail: u?.email ?? '',
        joinedAt,
      };
    });

    return NextResponse.json<ApiResponse<PendingMemberInfo[]>>(
      { data: result, message: 'Lấy danh sách yêu cầu chờ duyệt thành công', statusCode: 200 },
      { status: 200 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
