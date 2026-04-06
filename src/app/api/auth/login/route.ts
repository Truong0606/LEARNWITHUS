// POST /api/auth/login
// Login endpoint

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyPassword, generateToken, isValidEmail } from '@/lib/utils';
import { User, UserRole, LoginResponse, ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Email và mật khẩu là bắt buộc', statusCode: 400 },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Email không hợp lệ', statusCode: 400 },
        { status: 400 }
      );
    }

    // Find user by email
    const usersSnapshot = await adminDb
      .collection(COLLECTIONS.users)
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Email hoặc mật khẩu không đúng', statusCode: 401 },
        { status: 401 }
      );
    }

    const userDoc = usersSnapshot.docs[0];
    const user = userDoc.data() as User;

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Tài khoản đã bị vô hiệu hóa', statusCode: 403 },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash || '');
    if (!isPasswordValid) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Email hoặc mật khẩu không đúng', statusCode: 401 },
        { status: 401 }
      );
    }

    // Generate JWT token
    // Only role === 1 has full admin access (redirect to admin, manage all)
    const roleNames = ['Admin', 'Staff', 'Client', 'Manager', 'Mentor'];
    const resolveRoleName = (roleValue: unknown): string => {
      // role 1 = Admin (full admin privileges, only this role can access admin panel)
      if (typeof roleValue === 'number' && roleValue === 1) {
        return 'Admin';
      }
      if (typeof roleValue === 'number' && roleNames[roleValue]) {
        return roleNames[roleValue];
      }
      if (typeof roleValue === 'string') {
        const normalized = roleValue.trim().toLowerCase();
        const byName = roleNames.find((name) => name.toLowerCase() === normalized);
        if (byName) return byName;
        const asNumber = Number(roleValue);
        if (asNumber === 1) return 'Admin';
        if (!Number.isNaN(asNumber) && roleNames[asNumber]) {
          return roleNames[asNumber];
        }
      }
      return 'Client';
    };

    const roleName = resolveRoleName(user.role);
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: roleName,
      userName: user.fullName
    });

    const response: LoginResponse = {
      token,
      userName: user.fullName,
      role: roleName,
      userId: user.id,
      avatarUrl: user.avatarUrl
    };

    return NextResponse.json<ApiResponse<LoginResponse>>(
      { data: response, message: 'Đăng nhập thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

