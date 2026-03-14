// POST /api/admin/sync-members-count - Sync stored membersCount with actual count
// Requires SEED_SECRET in env and X-Seed-Secret header to match

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { ApiResponse } from '@/types';

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

    const membershipsSnapshot = await adminDb
      .collection(COLLECTIONS.groupMembers)
      .where('status', '==', 'active')
      .get();

    const countByGroupId: Record<string, number> = {};
    membershipsSnapshot.docs.forEach(doc => {
      const groupId = (doc.data() as { groupId: string }).groupId;
      countByGroupId[groupId] = (countByGroupId[groupId] || 0) + 1;
    });

    const now = FieldValue.serverTimestamp();
    let updated = 0;

    for (const [groupId, actualCount] of Object.entries(countByGroupId)) {
      const groupRef = adminDb.collection(COLLECTIONS.studyGroups).doc(groupId);
      const groupDoc = await groupRef.get();
      if (groupDoc.exists) {
        const storedCount = (groupDoc.data() as { membersCount?: number }).membersCount ?? 0;
        if (storedCount !== actualCount) {
          await groupRef.update({ membersCount: actualCount, updatedAt: now });
          updated++;
        }
      }
    }

    return NextResponse.json<ApiResponse<{ updated: number }>>(
      {
        data: { updated },
        message: `Đã đồng bộ ${updated} nhóm`,
        statusCode: 200,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
