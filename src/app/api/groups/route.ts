// GET /api/groups - List all study groups with user membership status
// POST /api/groups - Create a new study group

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { generateId } from '@/lib/firebase/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import type { ApiResponse, StudyGroup, StudyGroupWithMembership, GroupMembershipStatus } from '@/types';
import { User, UserRole } from '@/types';
import { getVipStatusFromUser } from '@/lib/vip';

export async function GET(request: NextRequest) {
  try {
    // Optional auth - if logged in, include membership status
    let userId: string | null = null;
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = verifyToken(token);
      if (payload) {
        userId = payload.userId;
      }
    }

    // Get all study groups
    const groupsSnapshot = await adminDb
      .collection(COLLECTIONS.studyGroups)
      .orderBy('membersCount', 'desc')
      .get();

    const groups = groupsSnapshot.docs.map(doc => ({ ...doc.data() as StudyGroup, id: doc.id }));

    // Get actual member counts from groupMembers (status=active)
    const membershipsSnapshot = await adminDb
      .collection(COLLECTIONS.groupMembers)
      .where('status', '==', 'active')
      .get();

    const countByGroupId: Record<string, number> = {};
    membershipsSnapshot.docs.forEach(doc => {
      const groupId = (doc.data() as { groupId: string }).groupId;
      countByGroupId[groupId] = (countByGroupId[groupId] || 0) + 1;
    });

    // Override membersCount with actual count
    groups.forEach(g => {
      g.membersCount = countByGroupId[g.id] ?? 0;
    });

    // Re-sort by actual membersCount
    groups.sort((a, b) => b.membersCount - a.membersCount);

    // If user is logged in, get their membership status for each group
    let membershipMap: Record<string, { status: GroupMembershipStatus; role?: string }> = {};

    if (userId) {
      const membershipsSnapshot = await adminDb
        .collection(COLLECTIONS.groupMembers)
        .where('userId', '==', userId)
        .get();

      for (const doc of membershipsSnapshot.docs) {
        const data = doc.data();
        membershipMap[data.groupId] = {
          status: data.status === 'active' ? 'member' : 'pending',
          role: data.role,
        };
      }
    }

    // Combine groups with membership info
    const result: StudyGroupWithMembership[] = groups.map(group => ({
      ...group,
      userMembershipStatus: membershipMap[group.id]?.status || 'none',
      userMemberRole: membershipMap[group.id]?.role as StudyGroupWithMembership['userMemberRole'],
    }));

    const res = NextResponse.json<ApiResponse<StudyGroupWithMembership[]>>({
      data: result,
      message: 'Lấy danh sách nhóm học thành công',
      statusCode: 200,
    });
    // res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return res;
  } catch {
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

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Token không hợp lệ', statusCode: 401 },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, subjectTags, isPrivate, coverColor } = body;

    // Fetch user once (needed for VIP check + private group check)
    const userDoc = await adminDb.collection(COLLECTIONS.users).doc(payload.userId).get();
    if (!userDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy người dùng', statusCode: 404 },
        { status: 404 }
      );
    }
    const user = userDoc.data() as User;
    const { isVip } = getVipStatusFromUser(user);
    const isMentorOrAdmin = user.role === UserRole.Mentor || user.role === UserRole.Admin || user.role === UserRole.Staff;

    // Regular users (non-VIP, non-Mentor, non-Admin) cannot create groups at all
    if (!isVip && !isMentorOrAdmin) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          message: 'Nâng cấp VIP để tạo nhóm học. Thành viên thường không có quyền tạo nhóm.',
          statusCode: 403,
        },
        { status: 403 }
      );
    }

    // VIP users can only create public groups
    if (isVip && !isMentorOrAdmin && isPrivate) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          message: 'Thành viên VIP chỉ có thể tạo nhóm công khai. Chỉ Mentor mới được tạo nhóm riêng tư.',
          statusCode: 403,
        },
        { status: 403 }
      );
    }

    // Only Mentor/Admin can create private groups
    if (isPrivate && !isMentorOrAdmin) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          message: 'Chỉ Mentor mới được tạo nhóm riêng tư.',
          statusCode: 403,
        },
        { status: 403 }
      );
    }

    if (!name || name.trim().length < 3) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Tên nhóm phải có ít nhất 3 ký tự', statusCode: 400 },
        { status: 400 }
      );
    }

    const now = FieldValue.serverTimestamp();
    const groupId = generateId();

    // Create the group
    const groupData = {
      id: groupId,
      name: name.trim(),
      description: description?.trim() || '',
      coverColor: coverColor || 'from-slate-800 via-slate-900 to-slate-950',
      subjectTags: subjectTags || [],
      isPrivate: isPrivate || false,
      createdBy: payload.userId,
      membersCount: 1,
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.collection(COLLECTIONS.studyGroups).doc(groupId).set(groupData);

    // Auto add creator as admin member
    const memberId = generateId();
    await adminDb.collection(COLLECTIONS.groupMembers).doc(memberId).set({
      id: memberId,
      groupId,
      userId: payload.userId,
      role: 'admin',
      status: 'active',
      joinedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json<ApiResponse<{ id: string }>>(
      { data: { id: groupId }, message: 'Tạo nhóm học thành công', statusCode: 201 },
      { status: 201 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
