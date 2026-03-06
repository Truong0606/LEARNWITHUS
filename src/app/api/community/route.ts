// GET /api/community - List community posts
// POST /api/community - Create a new community post

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { generateId } from '@/lib/firebase/firestore';
import { verifyToken } from '@/lib/utils';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { ApiResponse, CommunityPost, User } from '@/types';
import { getVipStatusFromUser } from '@/lib/vip';

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

    // Fetch with orderBy only (no composite index needed), then filter in memory.
    // This avoids Firestore composite index requirement for where+orderBy.
    const fetchLimit = 100;
    const snapshot = await adminDb
      .collection(COLLECTIONS.communityPosts)
      .orderBy('createdAt', 'desc')
      .limit(fetchLimit)
      .get();

    let posts = snapshot.docs.map(doc => {
      const data = doc.data() as Record<string, unknown>;
      return serializeTimestamps({ ...data, id: data.id ?? doc.id }) as unknown as CommunityPost;
    });

    // Filter by groupId in memory
    if (groupId) {
      // Group feed: only posts belonging to this group
      posts = posts.filter(p => p.groupId === groupId);
    } else {
      // Community feed: only posts NOT in any group (null, undefined, or empty)
      posts = posts.filter(p => p.groupId == null || p.groupId === '');
    }

    posts = posts.slice(0, limit);

    // Client-side tag filter (Firestore doesn't support array-contains + orderBy on different fields well)
    if (tag) {
      posts = posts.filter(p => p.tags.some(t => t.toLowerCase().includes(tag.toLowerCase())));
    }

    // Enrich with authorAvatarUrl and authorIsVip from users
    const authorIds = [...new Set(posts.map(p => p.authorId).filter(Boolean))];
    const avatarMap: Record<string, string> = {};
    const vipMap: Record<string, boolean> = {};
    if (authorIds.length > 0) {
      const refs = authorIds.map(id => adminDb.collection(COLLECTIONS.users).doc(id));
      const userDocs = await adminDb.getAll(...refs);
      userDocs.forEach((doc) => {
        const u = doc.data() as User | undefined;
        if (u?.avatarUrl) avatarMap[doc.id] = u.avatarUrl;
        if (u) vipMap[doc.id] = getVipStatusFromUser(u).isVip;
      });
    }

    // Add user-specific info and authorAvatarUrl
    const postsWithUserInfo = posts.map(post => ({
      ...post,
      authorAvatarUrl: (post as { authorAvatarUrl?: string }).authorAvatarUrl || avatarMap[post.authorId] || null,
      authorIsVip: (post as { authorIsVip?: boolean }).authorIsVip ?? vipMap[post.authorId] ?? false,
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
    const { title, body: postBody, groupId, tags, anonymous, images } = body;

    if (!postBody?.trim() && !title?.trim() && (!images || images.length === 0)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Bài viết phải có tiêu đề hoặc nội dung', statusCode: 400 },
        { status: 400 }
      );
    }

    // Parallel fetch: user and group are independent (async-parallel best practice)
    const userDocPromise = adminDb.collection(COLLECTIONS.users).doc(payload.userId).get();
    const groupDocPromise = groupId
      ? adminDb.collection(COLLECTIONS.studyGroups).doc(groupId).get()
      : Promise.resolve(null);

    const [userDoc, groupDoc] = await Promise.all([userDocPromise, groupDocPromise]);
    const userData = userDoc.data() as User | undefined;
    const { isVip: authorIsVip } = userData ? getVipStatusFromUser(userData) : { isVip: false };
    const authorName = anonymous ? 'Ẩn danh' : (userData?.fullName || payload.userName);
    const initials = authorName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
    const authorAvatarUrl = anonymous ? null : (userData?.avatarUrl || null);

    // Tier 2: Limit images per post (VIP: 10, non-VIP: 3)
    const maxImages = authorIsVip ? 10 : 3;
    const imageList = Array.isArray(images)
      ? images.filter((u: unknown) => typeof u === 'string').slice(0, maxImages)
      : [];

    let groupName: string | null = null;
    if (groupId && groupDoc) {
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
      authorAvatarUrl,
      authorTag: userData?.address ? `SV - ${userData.address}` : 'Sinh viên',
      authorIsVip,
      groupId: groupId || null,
      groupName,
      title: title?.trim() || '',
      body: postBody?.trim() || '',
      tags: tags || [],
      images: imageList,
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
