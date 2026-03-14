// GET /api/auth/profile  - Get current user profile
// PUT /api/auth/profile  - Update current user profile

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { FieldValue } from 'firebase-admin/firestore';
import type { ApiResponse, User } from '@/types';

// Response type (no passwordHash)
interface ProfileResponse {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  avatarUrl?: string;
  role: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  joinedGroupsCount: number;
}

export async function GET(request: NextRequest) {
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
        { data: null, message: 'Token không hợp lệ hoặc đã hết hạn', statusCode: 401 },
        { status: 401 }
      );
    }

    // Get user from Firestore
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

    // Count joined groups
    const groupsSnapshot = await adminDb
      .collection(COLLECTIONS.groupMembers)
      .where('userId', '==', payload.userId)
      .where('status', '==', 'active')
      .get();

    const profile: ProfileResponse = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      avatarUrl: user.avatarUrl,
      role: typeof user.role === 'number' ? user.role : 2,
      isActive: user.isActive,
      createdAt: user.createdAt instanceof Object && 'toDate' in user.createdAt
        ? (user.createdAt as { toDate: () => Date }).toDate().toISOString()
        : String(user.createdAt),
      updatedAt: user.updatedAt instanceof Object && 'toDate' in user.updatedAt
        ? (user.updatedAt as { toDate: () => Date }).toDate().toISOString()
        : String(user.updatedAt || user.createdAt),
      joinedGroupsCount: groupsSnapshot.size,
    };

    return NextResponse.json<ApiResponse<ProfileResponse>>({
      data: profile,
      message: 'Lấy thông tin thành công',
      statusCode: 200,
    });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
        { data: null, message: 'Token không hợp lệ hoặc đã hết hạn', statusCode: 401 },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fullName, phone, address } = body;

    // Validate
    if (fullName !== undefined && fullName.trim().length < 2) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Họ tên phải có ít nhất 2 ký tự', statusCode: 400 },
        { status: 400 }
      );
    }

    if (phone !== undefined && phone.trim().length > 0) {
      const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
      if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Số điện thoại không hợp lệ', statusCode: 400 },
          { status: 400 }
        );
      }
    }

    // Check user exists
    const userRef = adminDb.collection(COLLECTIONS.users).doc(payload.userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy người dùng', statusCode: 404 },
        { status: 404 }
      );
    }

    // Build update data (only include provided fields)
    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (fullName !== undefined) {
      updateData.fullName = fullName.trim();
    }
    if (phone !== undefined) {
      updateData.phone = phone.trim();
    }
    if (address !== undefined) {
      updateData.address = address.trim();
    }

    // Update Firestore
    await userRef.update(updateData);

    // Get updated user
    const updatedDoc = await userRef.get();
    const updatedUser = updatedDoc.data() as User;

    const profile = {
      id: updatedUser.id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      phone: updatedUser.phone || '',
      address: updatedUser.address || '',
    };

    return NextResponse.json<ApiResponse<typeof profile>>({
      data: profile,
      message: 'Cập nhật thông tin thành công',
      statusCode: 200,
    });
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
