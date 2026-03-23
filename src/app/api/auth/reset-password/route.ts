// POST /api/auth/reset-password
// Verify OTP and reset password

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { hashPassword, verifyOTP, isValidEmail } from '@/lib/utils';
import { timestampToDate } from '@/lib/firebase/firestore';
import { User, OtpCode, OtpPurpose, ApiResponse } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    let body: { email?: string; otpCode?: string; newPassword?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Dữ liệu không hợp lệ', statusCode: 400 },
        { status: 400 }
      );
    }
    const { email, otpCode, newPassword } = body;

    // Validate required fields
    if (!email || !otpCode || !newPassword) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng điền đầy đủ thông tin', statusCode: 400 },
        { status: 400 }
      );
    }

    // Validate email
    if (!isValidEmail(email)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Email không hợp lệ', statusCode: 400 },
        { status: 400 }
      );
    }

    // Validate password length
    if (newPassword.length < 6) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Mật khẩu phải có ít nhất 6 ký tự', statusCode: 400 },
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
        { data: null, message: 'Không tìm thấy tài khoản', statusCode: 404 },
        { status: 404 }
      );
    }

    const userDoc = usersSnapshot.docs[0];
    const user = userDoc.data() as User;
    const userId = user.id ?? userDoc.id;

    // Find valid OTP (get recent ones, pick latest in memory to avoid extra index)
    const now = new Date();
    const otpSnapshot = await adminDb
      .collection(COLLECTIONS.otpCodes)
      .where('userId', '==', userId)
      .where('purpose', '==', OtpPurpose.ResetPassword)
      .where('isUsed', '==', false)
      .limit(10)
      .get();

    const validOtps = otpSnapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as OtpCode & { id: string }))
      .filter((o) => {
        const exp = timestampToDate(o.expiresAt as any);
        return exp.getTime() > now.getTime();
      })
      .sort((a, b) => {
        const aTime = timestampToDate(a.createdAt as any).getTime();
        const bTime = timestampToDate(b.createdAt as any).getTime();
        return bTime - aTime;
      });

    if (validOtps.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Mã OTP không hợp lệ hoặc đã hết hạn', statusCode: 400 },
        { status: 400 }
      );
    }

    const otpData = validOtps[0];

    // Verify OTP
    if (!verifyOTP(String(otpCode).trim(), otpData.hashedCode)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Mã OTP không chính xác', statusCode: 400 },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user password
    await adminDb.collection(COLLECTIONS.users).doc(userId).update({
      passwordHash,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Mark OTP as used
    await adminDb.collection(COLLECTIONS.otpCodes).doc(otpData.id).update({
      isUsed: true,
      updatedAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json<ApiResponse<{ success: boolean }>>(
      { 
        data: { success: true }, 
        message: 'Đặt lại mật khẩu thành công', 
        statusCode: 200 
      },
      { status: 200 }
    );

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    const detail = process.env.NODE_ENV === 'development' ? `: ${errMsg}` : '';
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: `Lỗi máy chủ${detail}`, statusCode: 500 },
      { status: 500 }
    );
  }
}
