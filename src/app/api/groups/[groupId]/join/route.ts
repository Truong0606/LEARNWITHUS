// POST /api/groups/[groupId]/join - Join a study group

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { generateId } from '@/lib/firebase/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import type { ApiResponse, StudyGroup } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;

    // Auth required
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng đăng nhập để tham gia nhóm', statusCode: 401 },
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

    const userId = payload.userId;

    let groupDoc = await adminDb
      .collection(COLLECTIONS.studyGroups)
      .doc(groupId)
      .get();

    let actualGroupId = groupId;

    if (!groupDoc.exists) {
      // Fallback: search by id field in case they match but document ID is different
      const fallbackSnapshot = await adminDb
        .collection(COLLECTIONS.studyGroups)
        .where('id', '==', groupId)
        .limit(1)
        .get();

      if (fallbackSnapshot.empty) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Không tìm thấy nhóm học', statusCode: 404 },
          { status: 404 }
        );
      }
      groupDoc = fallbackSnapshot.docs[0];
      actualGroupId = groupDoc.id;
    }

    const group = { ...groupDoc.data() as StudyGroup, id: actualGroupId };
    const membershipGroupId = actualGroupId; // Use the matched document ID for membership checks

    // Check if already a member
    const existingMember = await adminDb
      .collection(COLLECTIONS.groupMembers)
      .where('groupId', '==', actualGroupId)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (!existingMember.empty) {
      const existingData = existingMember.docs[0].data();
      if (existingData.status === 'active') {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Bạn đã là thành viên của nhóm này', statusCode: 400 },
          { status: 400 }
        );
      }
      if (existingData.status === 'pending') {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Yêu cầu tham gia của bạn đang chờ duyệt', statusCode: 400 },
          { status: 400 }
        );
      }
    }

    const now = FieldValue.serverTimestamp();
    const memberId = generateId();

    // For private groups: status = 'pending', for public: status = 'active'
    const memberStatus = group.isPrivate ? 'pending' : 'active';

    // Create membership record
    await adminDb.collection(COLLECTIONS.groupMembers).doc(memberId).set({
      id: memberId,
      groupId: actualGroupId,
      userId,
      role: 'member',
      status: memberStatus,
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // Increment members count (only for public groups / active members)
    if (!group.isPrivate) {
      await adminDb
        .collection(COLLECTIONS.studyGroups)
        .doc(actualGroupId)
        .update({
          membersCount: FieldValue.increment(1),
          updatedAt: now,
        });
    }

    const message = group.isPrivate
      ? 'Đã gửi yêu cầu tham gia nhóm. Vui lòng chờ mentor duyệt.'
      : 'Tham gia nhóm học thành công!';

    return NextResponse.json<ApiResponse<{ status: string }>>(
      { data: { status: memberStatus }, message, statusCode: 200 },
      { status: 200 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
