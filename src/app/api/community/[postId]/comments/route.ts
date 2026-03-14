// POST /api/community/[postId]/comments - Add a comment to a post

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { generateId } from '@/lib/firebase/firestore';
import { verifyToken } from '@/lib/utils';
import { FieldValue } from 'firebase-admin/firestore';
import type { ApiResponse, User } from '@/types';
import { getVipStatusFromUser } from '@/lib/vip';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    // Auth required
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

    const body = await request.json();
    const { body: commentBody, parentId } = body;

    if (!commentBody?.trim()) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Nội dung bình luận không được để trống', statusCode: 400 },
        { status: 400 }
      );
    }

    // Check post exists
    const postRef = adminDb.collection(COLLECTIONS.communityPosts).doc(postId);
    const postDoc = await postRef.get();
    if (!postDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Bài viết không tồn tại', statusCode: 404 },
        { status: 404 }
      );
    }

    // Get user info
    const userDoc = await adminDb.collection(COLLECTIONS.users).doc(payload.userId).get();
    const userData = userDoc.data() as User | undefined;
    const authorName = userData?.fullName || payload.userName;
    const initials = authorName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
    const authorAvatarUrl = userData?.avatarUrl || null;
    const authorIsVip = userData ? getVipStatusFromUser(userData).isVip : false;

    const now = FieldValue.serverTimestamp();
    const commentId = generateId();

    const commentData = {
      id: commentId,
      postId,
      authorId: payload.userId,
      authorName,
      authorAvatar: initials,
      authorAvatarUrl,
      authorIsVip,
      body: commentBody.trim(),
      parentId: parentId || null,
      likesCount: 0,
      likedBy: [],
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.collection(COLLECTIONS.communityComments).doc(commentId).set(commentData);

    // Increment post comment count
    await postRef.update({
      commentsCount: FieldValue.increment(1),
    });

    return NextResponse.json<ApiResponse<{ id: string }>>(
      { data: { id: commentId }, message: 'Bình luận thành công', statusCode: 201 },
      { status: 201 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
