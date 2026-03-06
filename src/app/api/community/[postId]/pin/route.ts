// POST /api/community/[postId]/pin - Toggle pin/unpin a post
// Allowed for:
//   - Platform Admin (any post)
//   - VIP group admin (posts in their group)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { FieldValue } from 'firebase-admin/firestore';
import type { ApiResponse, CommunityPost, User } from '@/types';
import { UserRole } from '@/types';
import { getVipStatusFromUser } from '@/lib/vip';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

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

    // Get post
    const postDoc = await adminDb.collection(COLLECTIONS.communityPosts).doc(postId).get();
    if (!postDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Bài viết không tồn tại', statusCode: 404 },
        { status: 404 }
      );
    }
    const post = postDoc.data() as CommunityPost;

    // Check permission: Admin can pin anywhere; VIP group admin can pin in their group
    const userDoc = await adminDb.collection(COLLECTIONS.users).doc(payload.userId).get();
    const user = userDoc.data() as User | undefined;
    const isAdmin = user?.role === UserRole.Admin;

    if (!isAdmin) {
      // Must be VIP
      const { isVip } = user ? getVipStatusFromUser(user) : { isVip: false };
      if (!isVip) {
        return NextResponse.json<ApiResponse<null>>(
          {
            data: null,
            message: 'Chỉ thành viên VIP mới có thể ghim bài viết',
            statusCode: 403,
          },
          { status: 403 }
        );
      }

      // Must be group admin of the group this post belongs to
      if (!post.groupId) {
        return NextResponse.json<ApiResponse<null>>(
          {
            data: null,
            message: 'Chỉ có thể ghim bài viết trong nhóm học',
            statusCode: 403,
          },
          { status: 403 }
        );
      }

      const memberSnap = await adminDb
        .collection(COLLECTIONS.groupMembers)
        .where('groupId', '==', post.groupId)
        .where('userId', '==', payload.userId)
        .where('role', '==', 'admin')
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (memberSnap.empty) {
        return NextResponse.json<ApiResponse<null>>(
          {
            data: null,
            message: 'Bạn không phải admin của nhóm này',
            statusCode: 403,
          },
          { status: 403 }
        );
      }
    }

    // Toggle pin
    const newPinned = !post.pinned;
    await adminDb.collection(COLLECTIONS.communityPosts).doc(postId).update({
      pinned: newPinned,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json<ApiResponse<{ pinned: boolean }>>(
      {
        data: { pinned: newPinned },
        message: newPinned ? 'Đã ghim bài viết' : 'Đã bỏ ghim bài viết',
        statusCode: 200,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/community/[postId]/pin error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
