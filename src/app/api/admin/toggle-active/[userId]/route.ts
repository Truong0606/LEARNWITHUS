// POST /api/admin/toggle-active/[userId] - Toggle user active status (Admin only)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { User, ApiResponse } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Unauthorized', statusCode: 401 },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Token không hợp lệ', statusCode: 401 },
        { status: 401 }
      );
    }

    // Check role (Admin only)
    if (payload.role !== 'Admin') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền truy cập', statusCode: 403 },
        { status: 403 }
      );
    }

    const { userId } = await context.params;

    // Cannot toggle own account
    if (userId === payload.userId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không thể thay đổi trạng thái tài khoản của chính mình', statusCode: 400 },
        { status: 400 }
      );
    }

    // Get user
    const userDoc = await adminDb.collection(COLLECTIONS.users).doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy người dùng', statusCode: 404 },
        { status: 404 }
      );
    }

    const user = userDoc.data() as User;
    const newIsActive = !user.isActive;

    // Update user status
    await adminDb.collection(COLLECTIONS.users).doc(userId).update({
      isActive: newIsActive,
      updatedAt: FieldValue.serverTimestamp()
    });

    const message = newIsActive 
      ? 'Tài khoản đã được mở khóa' 
      : 'Tài khoản đã bị khóa';

    return NextResponse.json<ApiResponse<{ isActive: boolean; userId: string }>>(
      { 
        data: { isActive: newIsActive, userId }, 
        message, 
        statusCode: 200 
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

