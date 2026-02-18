// GET /api/community/[postId] - Get post detail with comments

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { Timestamp } from 'firebase-admin/firestore';
import type { ApiResponse, CommunityPost, CommunityComment } from '@/types';

function serializeTimestamps<T extends Record<string, unknown>>(doc: T): T {
  const result = { ...doc };
  for (const key of Object.keys(result)) {
    const val = result[key];
    if (val instanceof Timestamp) {
      (result as Record<string, unknown>)[key] = val.toDate().toISOString();
    } else if (val && typeof val === 'object' && '_seconds' in (val as object) && '_nanoseconds' in (val as object)) {
      const ts = val as { _seconds: number; _nanoseconds: number };
      (result as Record<string, unknown>)[key] = new Date(ts._seconds * 1000 + ts._nanoseconds / 1e6).toISOString();
    }
  }
  return result;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    // Optional auth
    let userId: string | null = null;
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const payload = verifyToken(authHeader.split(' ')[1]);
      if (payload) userId = payload.userId;
    }

    // Get post
    const postDoc = await adminDb.collection(COLLECTIONS.communityPosts).doc(postId).get();
    if (!postDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Bài viết không tồn tại', statusCode: 404 },
        { status: 404 }
      );
    }

    const post = serializeTimestamps(postDoc.data() as Record<string, unknown>) as CommunityPost;

    // Get comments (sort in memory to avoid composite index requirement)
    const commentsSnapshot = await adminDb
      .collection(COLLECTIONS.communityComments)
      .where('postId', '==', postId)
      .get();

    const comments = commentsSnapshot.docs
      .map(doc => {
        const c = serializeTimestamps(doc.data() as Record<string, unknown>) as CommunityComment;
        return {
          ...c,
          liked: userId ? (c.likedBy || []).includes(userId) : false,
        };
      })
      .sort((a, b) => new Date(a.createdAt as unknown as string).getTime() - new Date(b.createdAt as unknown as string).getTime());

    // Build threaded comments (top-level + replies)
    const topLevel = comments.filter(c => !c.parentId);
    const replies = comments.filter(c => c.parentId);
    const threaded = topLevel.map(c => ({
      ...c,
      replies: replies.filter(r => r.parentId === c.id),
    }));

    // Get related posts (same tags, different id)
    let relatedPosts: { id: string; title: string; commentsCount: number }[] = [];
    if (post.tags.length > 0) {
      const relatedSnapshot = await adminDb
        .collection(COLLECTIONS.communityPosts)
        .orderBy('likesCount', 'desc')
        .limit(10)
        .get();

      relatedPosts = relatedSnapshot.docs
        .map(d => serializeTimestamps(d.data() as Record<string, unknown>) as CommunityPost)
        .filter(p => p.id !== postId && p.tags.some(t => post.tags.includes(t)))
        .slice(0, 3)
        .map(p => ({ id: p.id, title: p.title, commentsCount: p.commentsCount }));
    }

    return NextResponse.json<ApiResponse<{
      post: CommunityPost & { liked_by_user: boolean; saved_by_user: boolean };
      comments: typeof threaded;
      relatedPosts: typeof relatedPosts;
    }>>({
      data: {
        post: {
          ...post,
          liked_by_user: userId ? (post.likedBy || []).includes(userId) : false,
          saved_by_user: userId ? (post.savedBy || []).includes(userId) : false,
        },
        comments: threaded,
        relatedPosts,
      },
      message: 'Lấy chi tiết bài viết thành công',
      statusCode: 200,
    });
  } catch (error) {
    console.error('GET /api/community/[postId] error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
