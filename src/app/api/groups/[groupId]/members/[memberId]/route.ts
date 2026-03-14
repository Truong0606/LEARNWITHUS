// PATCH /api/groups/[groupId]/members/[memberId] - Approve or deny a pending member

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { FieldValue } from 'firebase-admin/firestore';
import type { ApiResponse } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; memberId: string }> }
) {
  try {
    const { groupId, memberId } = await params;

    // Auth required
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

    const body = await request.json();
    const { action } = body as { action: 'approve' | 'deny' };

    if (!action || !['approve', 'deny'].includes(action)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Action phải là "approve" hoặc "deny"', statusCode: 400 },
        { status: 400 }
      );
    }

    // Check group exists
    const groupDoc = await adminDb.collection(COLLECTIONS.studyGroups).doc(groupId).get();
    if (!groupDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy nhóm học', statusCode: 404 },
        { status: 404 }
      );
    }

    // Check that the current user is admin of this group
    const adminMemberSnap = await adminDb
      .collection(COLLECTIONS.groupMembers)
      .where('groupId', '==', groupId)
      .where('userId', '==', payload.userId)
      .where('role', '==', 'admin')
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (adminMemberSnap.empty) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Chỉ admin nhóm mới có quyền duyệt thành viên', statusCode: 403 },
        { status: 403 }
      );
    }

    // Get the member record
    const memberRef = adminDb.collection(COLLECTIONS.groupMembers).doc(memberId);
    const memberDoc = await memberRef.get();
    if (!memberDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy yêu cầu thành viên', statusCode: 404 },
        { status: 404 }
      );
    }

    const memberData = memberDoc.data()!;
    if (memberData.groupId !== groupId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Thành viên không thuộc nhóm này', statusCode: 400 },
        { status: 400 }
      );
    }

    if (memberData.status !== 'pending') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Yêu cầu này đã được xử lý', statusCode: 400 },
        { status: 400 }
      );
    }

    const now = FieldValue.serverTimestamp();

    if (action === 'approve') {
      // Approve: set status to active
      await memberRef.update({
        status: 'active',
        updatedAt: now,
      });

      // Increment group members count
      await adminDb.collection(COLLECTIONS.studyGroups).doc(groupId).update({
        membersCount: FieldValue.increment(1),
        updatedAt: now,
      });

      return NextResponse.json<ApiResponse<{ status: string }>>(
        { data: { status: 'active' }, message: 'Đã duyệt thành viên thành công', statusCode: 200 },
        { status: 200 }
      );
    } else {
      // Deny: remove the membership record
      await memberRef.delete();

      return NextResponse.json<ApiResponse<{ status: string }>>(
        { data: { status: 'denied' }, message: 'Đã từ chối yêu cầu tham gia', statusCode: 200 },
        { status: 200 }
      );
    }
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
