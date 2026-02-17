// GET /api/payments - Get all payments (Admin/Staff)
// POST /api/payments - Create payment (deposit or remaining)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { createDocument } from '@/lib/firebase/firestore';
import { 
  Payment, 
  TestBooking,
  ApiResponse,
  PaymentStatus,
  BookingStatus 
} from '@/types';
import { 
  createPaymentLink, 
  generateOrderCode, 
  calculateDepositAmount,
  calculateRemainingAmount,
  PAYOS_CONFIG 
} from '@/lib/payos';

// GET - Get all payments
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

    let paymentsQuery: FirebaseFirestore.Query = adminDb.collection(COLLECTIONS.payments);

    // Client can only see their own payments
    if (payload.role === 'Client') {
      // Get bookings first to get payment IDs
      const bookingsSnapshot = await adminDb
        .collection(COLLECTIONS.testBookings)
        .where('clientId', '==', payload.userId)
        .get();

      const bookingIds = bookingsSnapshot.docs.map(doc => doc.id);
      
      if (bookingIds.length === 0) {
        return NextResponse.json<ApiResponse<Payment[]>>(
          { data: [], message: 'Không có thanh toán nào', statusCode: 200 },
          { status: 200 }
        );
      }

      // Firestore 'in' query limit is 30
      const chunks = [];
      for (let i = 0; i < bookingIds.length; i += 30) {
        chunks.push(bookingIds.slice(i, i + 30));
      }

      const payments: Payment[] = [];
      for (const chunk of chunks) {
        const chunkSnapshot = await adminDb
          .collection(COLLECTIONS.payments)
          .where('bookingId', 'in', chunk)
          .get();
        
        for (const doc of chunkSnapshot.docs) {
          const paymentData = doc.data() as Payment;
          
          // Get booking info
          if (paymentData.bookingId) {
            const bookingDoc = await adminDb
              .collection(COLLECTIONS.testBookings)
              .doc(paymentData.bookingId)
              .get();
            
            if (bookingDoc.exists) {
              paymentData.booking = bookingDoc.data() as TestBooking;
            }
          }
          
          payments.push(paymentData);
        }
      }

      return NextResponse.json<ApiResponse<Payment[]>>(
        { data: payments, message: 'Lấy danh sách thanh toán thành công', statusCode: 200 },
        { status: 200 }
      );
    }

    // Staff/Admin can see all
    paymentsQuery = paymentsQuery.orderBy('createdAt', 'desc');

    const paymentsSnapshot = await paymentsQuery.get();
    const payments: Payment[] = [];

    for (const doc of paymentsSnapshot.docs) {
      const paymentData = doc.data() as Payment;
      
      // Get booking info
      if (paymentData.bookingId) {
        const bookingDoc = await adminDb
          .collection(COLLECTIONS.testBookings)
          .doc(paymentData.bookingId)
          .get();
        
        if (bookingDoc.exists) {
          paymentData.booking = bookingDoc.data() as TestBooking;
        }
      }
      
      payments.push(paymentData);
    }

    return NextResponse.json<ApiResponse<Payment[]>>(
      { data: payments, message: 'Lấy danh sách thanh toán thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// POST - Create payment link
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

    const body: { 
      bookingId: string; 
      paymentType: 'deposit' | 'remaining';
    } = await request.json();

    const { bookingId, paymentType } = body;

    if (!bookingId || !paymentType) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Thiếu thông tin bắt buộc', statusCode: 400 },
        { status: 400 }
      );
    }

    // Get booking
    const bookingDoc = await adminDb
      .collection(COLLECTIONS.testBookings)
      .doc(bookingId)
      .get();

    if (!bookingDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy đặt lịch', statusCode: 404 },
        { status: 404 }
      );
    }

    const booking = bookingDoc.data() as TestBooking;

    // Check permission
    if (payload.role === 'Client' && booking.clientId !== payload.userId) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền thanh toán đặt lịch này', statusCode: 403 },
        { status: 403 }
      );
    }

    // Validate payment type based on booking status
    if (paymentType === 'deposit') {
      if (booking.status !== BookingStatus.Pending) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Đặt lịch không ở trạng thái chờ đặt cọc', statusCode: 400 },
          { status: 400 }
        );
      }
    } else if (paymentType === 'remaining') {
      if (booking.status !== BookingStatus.ResultReady) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Đặt lịch chưa có kết quả để thanh toán còn lại', statusCode: 400 },
          { status: 400 }
        );
      }
    }

    // Calculate amount
    const totalPrice = booking.price;
    const depositAmount = calculateDepositAmount(totalPrice);
    const remainingAmount = calculateRemainingAmount(totalPrice);
    const paymentAmount = paymentType === 'deposit' ? depositAmount : remainingAmount;

    // Generate order code
    const orderCode = generateOrderCode();

    // Create PayOS payment link
    const description = paymentType === 'deposit' 
      ? `Dat coc don ${bookingId.slice(-6)}`
      : `Thanh toan con lai don ${bookingId.slice(-6)}`;

    const payosResponse = await createPaymentLink({
      orderCode,
      amount: paymentAmount,
      description,
      buyerName: booking.clientName,
      buyerPhone: booking.phone,
      returnUrl: `${PAYOS_CONFIG.returnUrl}?bookingId=${bookingId}&type=${paymentType}`,
      cancelUrl: `${PAYOS_CONFIG.cancelUrl}?bookingId=${bookingId}`,
      items: [{
        name: paymentType === 'deposit' ? 'Đặt cọc xét nghiệm ADN' : 'Thanh toán còn lại',
        quantity: 1,
        price: paymentAmount
      }]
    });

    if (payosResponse.code !== '00') {
      console.error('PayOS error:', payosResponse);
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: `Lỗi tạo thanh toán: ${payosResponse.desc}`, statusCode: 400 },
        { status: 400 }
      );
    }

    // Save payment to database
    const paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'> = {
      orderCode,
      amount: paymentAmount,
      depositAmount: paymentType === 'deposit' ? paymentAmount : undefined,
      remainingAmount: paymentType === 'remaining' ? paymentAmount : undefined,
      status: PaymentStatus.Pending,
      description,
      bookingId
    };

    const paymentId = await createDocument(COLLECTIONS.payments, paymentData);

    return NextResponse.json<ApiResponse<{
      paymentId: string;
      checkoutUrl: string;
      qrCode: string;
      orderCode: number;
      amount: number;
    }>>(
      { 
        data: {
          paymentId,
          checkoutUrl: payosResponse.data?.checkoutUrl || '',
          qrCode: payosResponse.data?.qrCode || '',
          orderCode,
          amount: paymentAmount
        }, 
        message: 'Tạo thanh toán thành công', 
        statusCode: 201 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
