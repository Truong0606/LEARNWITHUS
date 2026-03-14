// GET /api/mentor/check - Verify current user is a registered Mentor
// Returns 200 if mentor, 403 if not

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { User, ApiResponse, UserRole } from '@/types';

export async function GET(request: NextRequest) {
  try {
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

    const userDoc = await adminDb
      .collection(COLLECTIONS.users)
      .doc(payload.userId)
      .get();

    if (!userDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy người dùng', statusCode: 404 },
        { status: 404 }
      );
    }

    const user = userDoc.data() as User;

    const isMentor = user.role === UserRole.Mentor;

    if (!isMentor) {
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          message: 'Chỉ tài khoản Mentor đã được duyệt mới có thể truy cập trang này',
          statusCode: 403,
        },
        { status: 403 }
      );
    }

    return NextResponse.json<ApiResponse<{ ok: boolean }>>(
      { data: { ok: true }, message: 'OK', statusCode: 200 },
      { status: 200 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
