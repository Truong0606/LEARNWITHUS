// POST /api/groups/[groupId]/invite - Send group invite email

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { isValidEmail, verifyToken } from '@/lib/utils';
import { sendGroupInviteEmail } from '@/lib/email';
import type { ApiResponse, StudyGroup } from '@/types';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ groupId: string }> }
) {
    try {
        const { groupId } = await params;

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

        let body: { email?: string; message?: string } = {};
        try {
            body = await request.json();
        } catch {
            body = {};
        }

        const email = String(body.email || '').trim().toLowerCase();
        const message = String(body.message || '').trim();

        if (!email) {
            return NextResponse.json<ApiResponse<null>>(
                { data: null, message: 'Vui lòng nhập email', statusCode: 400 },
                { status: 400 }
            );
        }

        if (!isValidEmail(email)) {
            return NextResponse.json<ApiResponse<null>>(
                { data: null, message: 'Email không hợp lệ', statusCode: 400 },
                { status: 400 }
            );
        }

        // Check group exists
        const groupDoc = await adminDb
            .collection(COLLECTIONS.studyGroups)
            .doc(groupId)
            .get();

        if (!groupDoc.exists) {
            return NextResponse.json<ApiResponse<null>>(
                { data: null, message: 'Không tìm thấy nhóm học', statusCode: 404 },
                { status: 404 }
            );
        }

        // Only active members can invite
        const memberSnapshot = await adminDb
            .collection(COLLECTIONS.groupMembers)
            .where('groupId', '==', groupId)
            .where('userId', '==', payload.userId)
            .where('status', '==', 'active')
            .limit(1)
            .get();

        if (memberSnapshot.empty) {
            return NextResponse.json<ApiResponse<null>>(
                { data: null, message: 'Chỉ thành viên của nhóm mới có thể gửi lời mời', statusCode: 403 },
                { status: 403 }
            );
        }

        const group = groupDoc.data() as StudyGroup;
        const inviteUrl = `${request.nextUrl.origin}/groups/${groupId}`;
        const inviterName = payload.userName || 'Thành viên StudyHub';

        const emailResult = await sendGroupInviteEmail(email, {
            groupName: group.name,
            inviterName,
            inviteUrl,
            message: message || undefined,
        });

        if (!emailResult.success) {
            return NextResponse.json<ApiResponse<null>>(
                { data: null, message: emailResult.error || 'Không thể gửi email mời', statusCode: 500 },
                { status: 500 }
            );
        }

        return NextResponse.json<ApiResponse<null>>(
            { data: null, message: 'Đã gửi lời mời qua email', statusCode: 200 },
            { status: 200 }
        );
    } catch {
        return NextResponse.json<ApiResponse<null>>(
            { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
            { status: 500 }
        );
    }
}
