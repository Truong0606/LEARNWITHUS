// GET /api/groups/[groupId] - Get group detail with members

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import type {
  ApiResponse,
  StudyGroup,
  StudyGroupDetail,
  GroupMemberInfo,
  GroupMembershipStatus,
  User,
} from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;

    let groupDoc = await adminDb
      .collection(COLLECTIONS.studyGroups)
      .doc(groupId)
      .get();

    let actualGroupId = groupId;

    if (!groupDoc.exists) {
      // Fallback: search by id field in case they match but document ID is different
      const fallbackSnapshot = await adminDb
        .collection(COLLECTIONS.studyGroups)
        .where('id', '==', groupId)
        .limit(1)
        .get();

      if (fallbackSnapshot.empty) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Không tìm thấy nhóm học', statusCode: 404 },
          { status: 404 }
        );
      }
      groupDoc = fallbackSnapshot.docs[0];
      actualGroupId = groupDoc.id;
    }

    const group = { ...groupDoc.data() as StudyGroup, id: actualGroupId };

    // Optional auth
    let userId: string | null = null;
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = verifyToken(token);
      if (payload) {
        userId = payload.userId;
      }
    }

    // Get all active members of this group
    const membersSnapshot = await adminDb
      .collection(COLLECTIONS.groupMembers)
      .where('groupId', '==', actualGroupId)
      .where('status', '==', 'active')
      .get();

    // Also fetch pending members (for private groups, visible to admin)
    const pendingSnapshot = group.isPrivate
      ? await adminDb
        .collection(COLLECTIONS.groupMembers)
        .where('groupId', '==', actualGroupId)
        .where('status', '==', 'pending')
        .get()
      : null;

    // Helper to build member info from snapshot docs
    async function buildMemberInfoList(docs: FirebaseFirestore.QueryDocumentSnapshot[]): Promise<GroupMemberInfo[]> {
      const userIds = docs.map(doc => doc.data().userId);
      const result: GroupMemberInfo[] = [];
      if (userIds.length === 0) return result;

      for (let i = 0; i < userIds.length; i += 10) {
        const batch = userIds.slice(i, i + 10);
        const usersSnapshot = await adminDb
          .collection(COLLECTIONS.users)
          .where('id', 'in', batch)
          .get();

        const usersMap: Record<string, User> = {};
        usersSnapshot.docs.forEach(doc => {
          const user = doc.data() as User;
          const uid = user.id ?? doc.id;
          usersMap[uid] = { ...user, id: uid };
        });

        docs
          .filter(doc => batch.includes(doc.data().userId))
          .forEach(doc => {
            const memberData = doc.data();
            const user = usersMap[memberData.userId];
            if (user) {
              const nameParts = user.fullName.split(' ');
              const avatar = nameParts.length >= 2
                ? (nameParts[nameParts.length - 2][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
                : user.fullName.slice(0, 2).toUpperCase();

              result.push({
                id: memberData.id,
                userId: memberData.userId,
                name: user.fullName,
                avatar,
                avatarUrl: user.avatarUrl || null,
                role: memberData.role,
                status: memberData.status,
                joinedAt: memberData.joinedAt?.toDate?.() || memberData.joinedAt,
              });
            }
          });
      }
      return result;
    }

    const members = await buildMemberInfoList(membersSnapshot.docs);
    const pendingMembers = pendingSnapshot ? await buildMemberInfoList(pendingSnapshot.docs) : [];

    // Sort: admin first, then moderator, then member
    const roleOrder = { admin: 0, moderator: 1, member: 2 };
    members.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);

    // Check user membership
    let userMembershipStatus: GroupMembershipStatus = 'none';
    let userMemberRole: GroupMemberInfo['role'] | undefined;

    if (userId) {
      const userMembershipSnapshot = await adminDb
        .collection(COLLECTIONS.groupMembers)
        .where('groupId', '==', actualGroupId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (!userMembershipSnapshot.empty) {
        const memberData = userMembershipSnapshot.docs[0].data();
        userMembershipStatus = memberData.status === 'active' ? 'member' : 'pending';
        userMemberRole = memberData.role;
      }
    }

    // Use actual member count from groupMembers (not stored membersCount which may be stale)
    const actualMembersCount = members.length;

    const result: StudyGroupDetail = {
      ...group,
      membersCount: actualMembersCount,
      userMembershipStatus,
      userMemberRole,
      members,
      // Only include pending members for group admins
      ...(userMemberRole === 'admin' && pendingMembers.length > 0
        ? { pendingMembers }
        : {}),
    };

    return NextResponse.json<ApiResponse<StudyGroupDetail>>({
      data: result,
      message: 'Lấy thông tin nhóm học thành công',
      statusCode: 200,
    });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
