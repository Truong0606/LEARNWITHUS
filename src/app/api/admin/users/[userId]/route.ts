// PUT /api/admin/users/[userId] - Update user (Admin only)
// DELETE /api/admin/users/[userId] - Disable user / vô hiệu hóa (Admin only)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken, isValidEmail, isValidPhone } from '@/lib/utils';
import { ApiResponse, UserRole } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

function requireAdmin(request: NextRequest): { userId: string; role: string } | NextResponse {
  const authHeader = request.headers.get('authorization');
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
  if (payload.role !== 'Admin') {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Không có quyền truy cập', statusCode: 403 },
      { status: 403 }
    );
  }
  return { userId: payload.userId, role: payload.role };
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { userId } = await context.params;

    const userDoc = await adminDb.collection(COLLECTIONS.users).doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy người dùng', statusCode: 404 },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { fullName, email, phone, address, role, isActive } = body;

    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (fullName !== undefined) {
      const trimmed = String(fullName).trim();
      if (!trimmed) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Họ tên không được để trống', statusCode: 400 },
          { status: 400 }
        );
      }
      updateData.fullName = trimmed;
    }

    if (email !== undefined) {
      const trimmed = String(email).trim().toLowerCase();
      if (!isValidEmail(trimmed)) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Email không hợp lệ', statusCode: 400 },
          { status: 400 }
        );
      }
      const existing = await adminDb
        .collection(COLLECTIONS.users)
        .where('email', '==', trimmed)
        .limit(1)
        .get();
      if (!existing.empty && existing.docs[0].id !== userId) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Email đã được sử dụng bởi tài khoản khác', statusCode: 400 },
          { status: 400 }
        );
      }
      updateData.email = trimmed;
    }

    if (phone !== undefined) {
      const trimmed = String(phone).trim();
      if (trimmed && !isValidPhone(trimmed)) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Số điện thoại không hợp lệ', statusCode: 400 },
          { status: 400 }
        );
      }
      if (trimmed) {
        const existing = await adminDb
          .collection(COLLECTIONS.users)
          .where('phone', '==', trimmed)
          .limit(1)
          .get();
        if (!existing.empty && existing.docs[0].id !== userId) {
          return NextResponse.json<ApiResponse<null>>(
            { data: null, message: 'Số điện thoại đã được sử dụng bởi tài khoản khác', statusCode: 400 },
            { status: 400 }
          );
        }
      }
      updateData.phone = trimmed || '';
    }

    if (address !== undefined) {
      updateData.address = String(address).trim() || '';
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    if (role !== undefined) {
      const roleNum = typeof role === 'number' ? role : parseInt(String(role), 10);
      if (isNaN(roleNum) || !(roleNum in UserRole)) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Vai trò không hợp lệ', statusCode: 400 },
          { status: 400 }
        );
      }
      if (userId === auth.userId && roleNum !== 1) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Không thể thay đổi vai trò của chính mình', statusCode: 400 },
          { status: 400 }
        );
      }
      updateData.role = roleNum;
    }

    if (Object.keys(updateData).length <= 1) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có dữ liệu để cập nhật', statusCode: 400 },
        { status: 400 }
      );
    }

    await adminDb.collection(COLLECTIONS.users).doc(userId).update(updateData);

    return NextResponse.json<ApiResponse<{ userId: string }>>(
      { data: { userId }, message: 'Cập nhật người dùng thành công', statusCode: 200 },
      { status: 200 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = requireAdmin(request);
    if (auth instanceof NextResponse) return auth;

    const { userId } = await context.params;

    if (userId === auth.userId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không thể vô hiệu hóa tài khoản của chính mình', statusCode: 400 },
        { status: 400 }
      );
    }

    const userDoc = await adminDb.collection(COLLECTIONS.users).doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy người dùng', statusCode: 404 },
        { status: 404 }
      );
    }

    await adminDb.collection(COLLECTIONS.users).doc(userId).update({
      isActive: false,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json<ApiResponse<{ userId: string }>>(
      { data: { userId }, message: 'Đã vô hiệu hóa tài khoản', statusCode: 200 },
      { status: 200 }
    );
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
