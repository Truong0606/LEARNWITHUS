// POST /api/admin/seed-dummy-members - Create dummy users and add them to groups
// Requires SEED_SECRET in env and X-Seed-Secret header to match

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { generateId } from '@/lib/firebase/firestore';
import { hashPassword } from '@/lib/utils';
import { FieldValue } from 'firebase-admin/firestore';
import type { ApiResponse } from '@/types';
import { UserRole } from '@/types';

const DUMMY_NAMES = [
  'Nguyễn Văn An',
  'Trần Thị Bình',
  'Lê Minh Cường',
  'Phạm Thu Hà',
  'Hoàng Đức Dũng',
  'Vũ Thị Mai',
  'Đặng Quang Huy',
  'Bùi Ngọc Lan',
  'Phan Văn Kiên',
  'Ngô Thị Linh',
  'Dương Minh Tuấn',
  'Lý Thu Hương',
  'Chu Văn Đạt',
  'Tạ Thị Ngọc',
  'Hồ Minh Phong',
];

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.SEED_SECRET;
    const headerSecret = request.headers.get('X-Seed-Secret');

    if (!secret || headerSecret !== secret) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Unauthorized', statusCode: 401 },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const count = Math.min(Math.max(parseInt(body.count as string) || 10, 5), DUMMY_NAMES.length);

    // Get all groups
    const groupsSnapshot = await adminDb
      .collection(COLLECTIONS.studyGroups)
      .get();

    const groupIds = groupsSnapshot.docs.map(d => d.id);

    if (groupIds.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Chưa có nhóm nào. Tạo nhóm trước.', statusCode: 400 },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword('dummy123');
    const createdUserIds: string[] = [];
    const now = FieldValue.serverTimestamp();

    // Create dummy users
    for (let i = 0; i < count; i++) {
      const name = DUMMY_NAMES[i];
      const userId = generateId();
      const email = `dummy${i + 1}_${Date.now()}@seed.test`;

      const userData = {
        id: userId,
        fullName: name,
        email,
        phone: `0900000${String(i + 1).padStart(3, '0')}`,
        address: 'Khoa CNTT',
        passwordHash,
        role: UserRole.Client,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };

      await adminDb.collection(COLLECTIONS.users).doc(userId).set(userData);
      createdUserIds.push(userId);
    }

    // Add each dummy user to 1-3 random groups
    let membershipsCreated = 0;
    for (const userId of createdUserIds) {
      const numGroups = Math.min(1 + Math.floor(Math.random() * 2), groupIds.length);
      const shuffled = [...groupIds].sort(() => Math.random() - 0.5);
      const groupsToJoin = shuffled.slice(0, numGroups);

      for (const groupId of groupsToJoin) {
        const existing = await adminDb
          .collection(COLLECTIONS.groupMembers)
          .where('groupId', '==', groupId)
          .where('userId', '==', userId)
          .limit(1)
          .get();

        if (existing.empty) {
          const memberId = generateId();
          await adminDb.collection(COLLECTIONS.groupMembers).doc(memberId).set({
            id: memberId,
            groupId,
            userId,
            role: 'member',
            status: 'active',
            joinedAt: now,
            createdAt: now,
            updatedAt: now,
          });
          membershipsCreated++;

          // Update group membersCount
          await adminDb.collection(COLLECTIONS.studyGroups).doc(groupId).update({
            membersCount: FieldValue.increment(1),
            updatedAt: now,
          });
        }
      }
    }

    return NextResponse.json<ApiResponse<{ users: number; memberships: number }>>(
      {
        data: { users: createdUserIds.length, memberships: membershipsCreated },
        message: `Đã tạo ${createdUserIds.length} tài khoản và ${membershipsCreated} thành viên nhóm`,
        statusCode: 201,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/admin/seed-dummy-members error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
