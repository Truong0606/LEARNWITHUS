// POST /api/email/test - Test email sending (Admin only)

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/utils';
import { ApiResponse, BookingStatus } from '@/types';
import { 
  sendOtpEmail, 
  sendBookingStatusEmail, 
  sendResultReadyEmail,
  sendWelcomeEmail 
} from '@/lib/email';

// POST - Test email sending
export async function POST(request: NextRequest) {
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

    // Only Admin can test emails
    if (payload.role !== 'Admin') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền thực hiện', statusCode: 403 },
        { status: 403 }
      );
    }

    const body: {
      type: 'otp' | 'booking_status' | 'result_ready' | 'welcome';
      to: string;
      data?: Record<string, unknown>;
    } = await request.json();

    const { type, to, data } = body;

    if (!type || !to) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Thiếu type hoặc email đích', statusCode: 400 },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'otp':
        result = await sendOtpEmail(to, '123456', 'reset');
        break;
      
      case 'booking_status':
        result = await sendBookingStatusEmail(
          to,
          data?.clientName as string || 'Test User',
          data?.bookingId as string || 'TEST123456',
          data?.serviceName as string || 'Xét nghiệm ADN Cha Con',
          (data?.status as BookingStatus) || BookingStatus.DepositPaid
        );
        break;
      
      case 'result_ready':
        result = await sendResultReadyEmail(
          to,
          data?.clientName as string || 'Test User',
          data?.bookingId as string || 'TEST123456',
          data?.serviceName as string || 'Xét nghiệm ADN Cha Con',
          'https://example.com/results/123'
        );
        break;
      
      case 'welcome':
        result = await sendWelcomeEmail(to, data?.fullName as string || 'Test User');
        break;
      
      default:
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Loại email không hợp lệ', statusCode: 400 },
          { status: 400 }
        );
    }

    if (result.success) {
      return NextResponse.json<ApiResponse<{ messageId: string }>>(
        { 
          data: { messageId: result.messageId || '' }, 
          message: 'Gửi email test thành công', 
          statusCode: 200 
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: `Gửi email thất bại: ${result.error}`, statusCode: 400 },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
