// GET /api/community - List community posts
// POST /api/community - Create a new community post

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { generateId } from '@/lib/firebase/firestore';
import { verifyToken } from '@/lib/utils';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { ApiResponse, CommunityPost } from '@/types';

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

export async function GET(request: NextRequest) {
  try {
    // Optional auth
    let userId: string | null = null;
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const payload = verifyToken(authHeader.split(' ')[1]);
      if (payload) userId = payload.userId;
    }

    // Query params
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId'); // filter by group
    const tag = searchParams.get('tag'); // filter by tag
    const limit = parseInt(searchParams.get('limit') || '20');

    let query: FirebaseFirestore.Query = adminDb
      .collection(COLLECTIONS.communityPosts)
      .orderBy('createdAt', 'desc');

    if (groupId) {
      query = query.where('groupId', '==', groupId);
    }

    query = query.limit(limit);

    const snapshot = await query.get();
    let posts = snapshot.docs.map(doc => serializeTimestamps(doc.data() as Record<string, unknown>) as CommunityPost);

    // Client-side tag filter (Firestore doesn't support array-contains + orderBy on different fields well)
    if (tag) {
      posts = posts.filter(p => p.tags.some(t => t.toLowerCase().includes(tag.toLowerCase())));
    }

    // Add user-specific info
    const postsWithUserInfo = posts.map(post => ({
      ...post,
      liked_by_user: userId ? (post.likedBy || []).includes(userId) : false,
      saved_by_user: userId ? (post.savedBy || []).includes(userId) : false,
    }));

    return NextResponse.json<ApiResponse<typeof postsWithUserInfo>>({
      data: postsWithUserInfo,
      message: 'Lấy danh sách bài viết thành công',
      statusCode: 200,
    });
  } catch (error) {
    console.error('GET /api/community error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const { title, body: postBody, groupId, tags, anonymous } = body;

    if (!postBody?.trim() && !title?.trim()) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Bài viết phải có tiêu đề hoặc nội dung', statusCode: 400 },
        { status: 400 }
      );
    }

    // Get author info
    const userDoc = await adminDb.collection(COLLECTIONS.users).doc(payload.userId).get();
    const userData = userDoc.data();
    const authorName = anonymous ? 'Ẩn danh' : (userData?.fullName || payload.userName);
    const initials = authorName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

    // Verify group if posting to a group
    let groupName: string | null = null;
    if (groupId) {
      const groupDoc = await adminDb.collection(COLLECTIONS.studyGroups).doc(groupId).get();
      if (!groupDoc.exists) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Nhóm không tồn tại', statusCode: 404 },
          { status: 404 }
        );
      }
      groupName = groupDoc.data()?.name || null;
    }

    const now = FieldValue.serverTimestamp();
    const postId = generateId();

    const postData: Record<string, unknown> = {
      id: postId,
      authorId: payload.userId,
      authorName,
      authorAvatar: initials,
      authorTag: userData?.address ? `SV - ${userData.address}` : 'Sinh viên',
      groupId: groupId || null,
      groupName,
      title: title?.trim() || '',
      body: postBody?.trim() || '',
      tags: tags || [],
      images: [],
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      likedBy: [],
      savedBy: [],
      pinned: false,
      anonymous: anonymous || false,
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.collection(COLLECTIONS.communityPosts).doc(postId).set(postData);

    return NextResponse.json<ApiResponse<{ id: string }>>(
      { data: { id: postId }, message: 'Đăng bài thành công', statusCode: 201 },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/community error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
