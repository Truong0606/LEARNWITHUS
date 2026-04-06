// POST /api/groups/[groupId]/leave - Leave a study group

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { getDocument } from '@/lib/firebase/firestore';
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

    const userId = payload.userId;

    // Check group exists
    const group = await getDocument<StudyGroup>(COLLECTIONS.studyGroups, groupId);

    if (!group) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy nhóm học', statusCode: 404 },
        { status: 404 }
      );
    }
    const actualGroupId = group.id;

    // Find membership record
    const membershipSnapshot = await adminDb
      .collection(COLLECTIONS.groupMembers)
      .where('groupId', '==', actualGroupId)
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (membershipSnapshot.empty) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Bạn không phải thành viên của nhóm này', statusCode: 400 },
        { status: 400 }
      );
    }

    const memberDoc = membershipSnapshot.docs[0];
    const memberData = memberDoc.data();

    // Prevent admin from leaving if they're the only admin
    if (memberData.role === 'admin') {
      const adminCount = await adminDb
        .collection(COLLECTIONS.groupMembers)
        .where('groupId', '==', actualGroupId)
        .where('role', '==', 'admin')
        .where('status', '==', 'active')
        .get();

      if (adminCount.size <= 1) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Bạn là admin duy nhất. Hãy chuyển quyền admin trước khi rời nhóm.', statusCode: 400 },
          { status: 400 }
        );
      }
    }

    const wasActive = memberData.status === 'active';

    // Delete membership record
    await adminDb
      .collection(COLLECTIONS.groupMembers)
      .doc(memberDoc.id)
      .delete();

    // Decrement members count (only if was active member)
    if (wasActive) {
      const now = FieldValue.serverTimestamp();
      await adminDb
        .collection(COLLECTIONS.studyGroups)
        .doc(actualGroupId)
        .update({
          membersCount: FieldValue.increment(-1),
          updatedAt: now,
        });
    }

    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Đã rời nhóm học thành công', statusCode: 200 },
      { status: 200 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
