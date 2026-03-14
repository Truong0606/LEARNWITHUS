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

    const post = serializeTimestamps(postDoc.data() as Record<string, unknown>) as unknown as CommunityPost;

    // Enrich post with authorAvatarUrl from user if not stored
    let authorAvatarUrl: string | null = (post as { authorAvatarUrl?: string }).authorAvatarUrl || null;
    if (!authorAvatarUrl && post.authorId) {
      const authorDoc = await adminDb.collection(COLLECTIONS.users).doc(post.authorId).get();
      const authorData = authorDoc.data() as { avatarUrl?: string } | undefined;
      authorAvatarUrl = authorData?.avatarUrl || null;
    }

    // Get comments (sort in memory to avoid composite index requirement)
    const commentsSnapshot = await adminDb
      .collection(COLLECTIONS.communityComments)
      .where('postId', '==', postId)
      .get();

    // Batch fetch author avatars for comments
    const commentAuthorIds = [...new Set(commentsSnapshot.docs.map(d => (d.data() as { authorId?: string }).authorId).filter((id): id is string => Boolean(id)))];
    const commentAvatarMap: Record<string, string> = {};
    if (commentAuthorIds.length > 0) {
      const refs = commentAuthorIds.map(id => adminDb.collection(COLLECTIONS.users).doc(id));
      const authorDocs = await adminDb.getAll(...refs);
      authorDocs.forEach((doc) => {
        const u = doc.data() as { avatarUrl?: string } | undefined;
        if (u?.avatarUrl) commentAvatarMap[doc.id] = u.avatarUrl;
      });
    }

    const comments = commentsSnapshot.docs
      .map(doc => {
        const c = serializeTimestamps(doc.data() as Record<string, unknown>) as unknown as CommunityComment;
        const storedAvatar = (c as { authorAvatarUrl?: string }).authorAvatarUrl;
        return {
          ...c,
          authorAvatarUrl: storedAvatar || commentAvatarMap[c.authorId] || null,
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
        .map(d => serializeTimestamps(d.data() as Record<string, unknown>) as unknown as CommunityPost)
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
          authorAvatarUrl,
          liked_by_user: userId ? (post.likedBy || []).includes(userId) : false,
          saved_by_user: userId ? (post.savedBy || []).includes(userId) : false,
        },
        comments: threaded,
        relatedPosts,
      },
      message: 'Lấy chi tiết bài viết thành công',
      statusCode: 200,
    });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
