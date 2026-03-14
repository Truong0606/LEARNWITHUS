// GET /api/user - Get all users (Admin only)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { User, ApiResponse, UserRole } from '@/types';
import { Timestamp } from 'firebase-admin/firestore';

// Role names mapping - role 1 = Admin (full admin access)
const roleNames: Record<UserRole, string> = {
  [UserRole.Admin]: 'Staff',   // 0
  [UserRole.Staff]: 'Admin',   // 1 = Admin
  [UserRole.Client]: 'Client',
  [UserRole.Manager]: 'Manager',
  [UserRole.Mentor]: 'Mentor'
};

// DTO for user list (without sensitive data)
interface UserListDto {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  isActive: boolean;
  isVip: boolean;
  vipPlan: string | null;
  vipExpiresAt: string | null;
  createdAt: Date;
}

// GET - Get all users (Admin only)
export async function GET(request: NextRequest) {
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

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');
    const isActiveFilter = searchParams.get('isActive');

    // Build query (no orderBy to avoid composite index requirement)
    let query: FirebaseFirestore.Query = adminDb.collection(COLLECTIONS.users);

    if (roleFilter !== null) {
      const roleValue = parseInt(roleFilter);
      if (!isNaN(roleValue) && roleValue in UserRole) {
        query = query.where('role', '==', roleValue);
      }
    }

    if (isActiveFilter !== null) {
      query = query.where('isActive', '==', isActiveFilter === 'true');
    }

    const snapshot = await query.get();

    const now = new Date();
    const users: UserListDto[] = snapshot.docs.map(doc => {
      const data = doc.data() as User;

      let vipExpiresAt: Date | null = null;
      if (data.vipExpiresAt) {
        vipExpiresAt = data.vipExpiresAt instanceof Timestamp
          ? (data.vipExpiresAt as unknown as Timestamp).toDate()
          : data.vipExpiresAt instanceof Date
            ? data.vipExpiresAt
            : new Date(data.vipExpiresAt as unknown as string);
      }
      const isVip = !!(vipExpiresAt && vipExpiresAt > now);

      return {
        id: data.id,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        role: roleNames[data.role] || 'Client',
        isActive: data.isActive,
        isVip,
        vipPlan: isVip ? ((data as unknown as Record<string, unknown>).vipPlan as string) ?? null : null,
        vipExpiresAt: vipExpiresAt ? vipExpiresAt.toISOString() : null,
        createdAt: data.createdAt instanceof Date 
          ? data.createdAt 
          : (data.createdAt as FirebaseFirestore.Timestamp).toDate()
      };
    });

    // Sort in-memory (avoids composite index)
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json<ApiResponse<UserListDto[]>>(
      { data: users, message: 'Lấy danh sách người dùng thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

