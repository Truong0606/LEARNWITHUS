// POST /api/community/[postId]/like - Toggle like on a post

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { FieldValue } from 'firebase-admin/firestore';
import type { ApiResponse, CommunityPost } from '@/types';

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

    const postRef = adminDb.collection(COLLECTIONS.communityPosts).doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Bài viết không tồn tại', statusCode: 404 },
        { status: 404 }
      );
    }

    const post = postDoc.data() as CommunityPost;
    const likedBy = post.likedBy || [];
    const alreadyLiked = likedBy.includes(payload.userId);

    if (alreadyLiked) {
      // Unlike
      await postRef.update({
        likedBy: FieldValue.arrayRemove(payload.userId),
        likesCount: FieldValue.increment(-1),
      });
    } else {
      // Like
      await postRef.update({
        likedBy: FieldValue.arrayUnion(payload.userId),
        likesCount: FieldValue.increment(1),
      });
    }

    return NextResponse.json<ApiResponse<{ liked: boolean }>>({
      data: { liked: !alreadyLiked },
      message: alreadyLiked ? 'Đã bỏ thích' : 'Đã thích bài viết',
      statusCode: 200,
    });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
