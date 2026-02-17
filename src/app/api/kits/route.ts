// GET /api/kits - Get all kits (Admin/Staff only)
// POST /api/kits - Create kit manually (Admin/Staff only)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { createDocument } from '@/lib/firebase/firestore';
import { 
  TestKit, 
  TestBooking,
  ApiResponse,
  SampleCollectionMethod 
} from '@/types';

// GET - Get all kits
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

    // Only Staff, Manager, Admin can view all kits
    if (!['Staff', 'Manager', 'Admin'].includes(payload.role)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền truy cập', statusCode: 403 },
        { status: 403 }
      );
    }

    const kitsSnapshot = await adminDb
      .collection(COLLECTIONS.testKits)
      .orderBy('createdAt', 'desc')
      .get();

    const kits: TestKit[] = [];

    for (const doc of kitsSnapshot.docs) {
      const kitData = doc.data() as TestKit;

      // Get booking info
      if (kitData.bookingId) {
        const bookingDoc = await adminDb
          .collection(COLLECTIONS.testBookings)
          .doc(kitData.bookingId)
          .get();
        
        if (bookingDoc.exists) {
          kitData.booking = bookingDoc.data() as TestBooking;
        }
      }

      kits.push(kitData);
    }

    return NextResponse.json<ApiResponse<TestKit[]>>(
      { data: kits, message: 'Lấy danh sách kit thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get kits error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// POST - Create kit manually
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

    // Only Staff, Manager, Admin can create kits
    if (!['Staff', 'Manager', 'Admin'].includes(payload.role)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền thực hiện', statusCode: 403 },
        { status: 403 }
      );
    }

    const body: { 
      bookingId: string; 
      collectionMethod: SampleCollectionMethod;
      sampleCount: number;
    } = await request.json();

    const { bookingId, collectionMethod, sampleCount } = body;

    // Validate
    if (!bookingId || !collectionMethod || !sampleCount) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng điền đầy đủ thông tin', statusCode: 400 },
        { status: 400 }
      );
    }

    // Check if booking exists
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

    // Check if kit already exists for this booking
    const existingKitSnapshot = await adminDb
      .collection(COLLECTIONS.testKits)
      .where('bookingId', '==', bookingId)
      .limit(1)
      .get();

    if (!existingKitSnapshot.empty) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Kit đã tồn tại cho đặt lịch này', statusCode: 400 },
        { status: 400 }
      );
    }

    // Create kit
    const kitData: Omit<TestKit, 'id' | 'createdAt' | 'updatedAt'> = {
      bookingId,
      collectionMethod,
      sampleCount,
      samples: []
    };

    const kitId = await createDocument(COLLECTIONS.testKits, kitData);

    return NextResponse.json<ApiResponse<{ kitId: string }>>(
      { data: { kitId }, message: 'Tạo kit thành công', statusCode: 201 },
      { status: 201 }
    );

  } catch (error) {
    console.error('Create kit error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
