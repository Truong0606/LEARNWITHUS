// GET /api/user/me - Get current user profile
// PUT /api/user/me - Update current user profile

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken, isValidPhone } from '@/lib/utils';
import { User, UserProfileResponse, UpdateProfileRequest, ApiResponse, UserRole } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

// Role names mapping
const roleNames: Record<UserRole, string> = {
  [UserRole.Admin]: 'Admin',
  [UserRole.Staff]: 'Staff',
  [UserRole.Client]: 'Client',
  [UserRole.Manager]: 'Manager'
};

// Helper to extract and verify token
function extractToken(request: NextRequest): { userId: string; role: string } | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  
  if (!payload) {
    return null;
  }

  return { userId: payload.userId, role: payload.role };
}

// GET - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const auth = extractToken(request);
    if (!auth) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Unauthorized', statusCode: 401 },
        { status: 401 }
      );
    }

    // Get user from database
    const userDoc = await adminDb.collection(COLLECTIONS.users).doc(auth.userId).get();

    if (!userDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy người dùng', statusCode: 404 },
        { status: 404 }
      );
    }

    const user = userDoc.data() as User;

    // Don't expose passwordHash
    const profile: UserProfileResponse = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: roleNames[user.role] || 'Client',
      isActive: user.isActive,
      createdAt: user.createdAt instanceof Date 
        ? user.createdAt 
        : (user.createdAt as FirebaseFirestore.Timestamp).toDate()
    };

    return NextResponse.json<ApiResponse<UserProfileResponse>>(
      { data: profile, message: 'Lấy thông tin thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// PUT - Update current user profile
export async function PUT(request: NextRequest) {
  try {
    const auth = extractToken(request);
    if (!auth) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Unauthorized', statusCode: 401 },
        { status: 401 }
      );
    }

    const body: UpdateProfileRequest = await request.json();
    const { fullName, phone, address } = body;

    // Validate phone if provided
    if (phone && !isValidPhone(phone)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Số điện thoại không hợp lệ', statusCode: 400 },
        { status: 400 }
      );
    }

    // Check if user exists
    const userDoc = await adminDb.collection(COLLECTIONS.users).doc(auth.userId).get();

    if (!userDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy người dùng', statusCode: 404 },
        { status: 404 }
      );
    }

    // Build update object (only update provided fields)
    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp()
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

    // Update user
    await adminDb.collection(COLLECTIONS.users).doc(auth.userId).update(updateData);

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { data: { success: true }, message: 'Cập nhật thông tin thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

