// POST /api/auth/forgot-password
// Request OTP for password reset

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { generateOTP, hashOTP, isValidEmail } from '@/lib/utils';
import { createDocument } from '@/lib/firebase/firestore';
import { sendOtpEmail } from '@/lib/email';
import { User, OtpPurpose, OtpDeliveryMethod, ApiResponse } from '@/types';

// OTP validity duration in minutes
const OTP_VALIDITY_MINUTES = 5;
// Cooldown between OTP requests in seconds
const OTP_COOLDOWN_SECONDS = 60;

export async function POST(request: NextRequest) {
  try {
    let body: { email?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Dữ liệu không hợp lệ', statusCode: 400 },
        { status: 400 }
      );
    }
    const { email } = body;

    // Validate email
    if (!email) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Email là bắt buộc', statusCode: 400 },
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
        { data: null, message: 'Không tìm thấy tài khoản với email này', statusCode: 404 },
        { status: 404 }
      );
    }

    const userDoc = usersSnapshot.docs[0];
    const user = userDoc.data() as User;
    const userId = user.id ?? userDoc.id;

    // Check for recent OTP (cooldown)
    const cooldownTime = new Date(Date.now() - OTP_COOLDOWN_SECONDS * 1000);
    const recentOtpSnapshot = await adminDb
      .collection(COLLECTIONS.otpCodes)
      .where('userId', '==', userId)
      .where('purpose', '==', OtpPurpose.ResetPassword)
      .where('isUsed', '==', false)
      .where('createdAt', '>', cooldownTime)
      .limit(1)
      .get();

    if (!recentOtpSnapshot.empty) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng đợi 60 giây trước khi yêu cầu mã OTP mới', statusCode: 429 },
        { status: 429 }
      );
    }

    // Generate OTP
    const otpCode = generateOTP(6);
    const hashedCode = hashOTP(otpCode);
    const expiresAt = new Date(Date.now() + OTP_VALIDITY_MINUTES * 60 * 1000);

    // Save OTP to database
    await createDocument(COLLECTIONS.otpCodes, {
      userId,
      hashedCode,
      deliveryMethod: OtpDeliveryMethod.Email,
      purpose: OtpPurpose.ResetPassword,
      expiresAt,
      isUsed: false,
      sentTo: email.toLowerCase()
    });

    const emailResult = await sendOtpEmail(email.toLowerCase(), otpCode, 'reset');
    const isDev = process.env.NODE_ENV === 'development';

    if (!emailResult.success) {
      if (isDev) {
        return NextResponse.json<ApiResponse<{ otpSent: boolean; expiresIn: number; devOtp: string }>>(
          {
            data: {
              otpSent: true,
              expiresIn: OTP_VALIDITY_MINUTES * 60,
              devOtp: otpCode,
            },
            message: `Email chưa gửi được (${emailResult.error || 'lỗi'}). Dùng mã OTP bên dưới khi chạy local.`,
            statusCode: 200,
          },
          { status: 200 }
        );
      }
      return NextResponse.json<ApiResponse<null>>(
        {
          data: null,
          message: `Không thể gửi email. Vui lòng thử lại sau.`,
          statusCode: 500,
        },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse<{ otpSent: boolean; expiresIn: number; devOtp?: string }>>(
      {
        data: {
          otpSent: true,
          expiresIn: OTP_VALIDITY_MINUTES * 60,
          ...(isDev && { devOtp: otpCode }),
        },
        message: 'Mã OTP đã được gửi đến email của bạn',
        statusCode: 200,
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
