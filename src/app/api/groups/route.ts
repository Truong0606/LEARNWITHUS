// GET /api/groups - List all study groups with user membership status
// POST /api/groups - Create a new study group

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { generateId } from '@/lib/firebase/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import type { ApiResponse, StudyGroup, StudyGroupWithMembership, GroupMembershipStatus } from '@/types';

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

    const groups = groupsSnapshot.docs.map(doc => doc.data() as StudyGroup);

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

    return NextResponse.json<ApiResponse<StudyGroupWithMembership[]>>({
      data: result,
      message: 'Lấy danh sách nhóm học thành công',
      statusCode: 200,
    });
  } catch (error) {
    console.error('GET /api/groups error:', error);
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
      coverColor: coverColor || 'from-violet-500 to-purple-600',
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
  } catch (error) {
    console.error('POST /api/groups error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
