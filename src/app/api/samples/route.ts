// GET /api/samples - Get all samples (Admin/Staff only)
// POST /api/samples - Create sample (Staff or Client for self-sample)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken, generateSampleCode } from '@/lib/utils';
import { createDocument } from '@/lib/firebase/firestore';
import { 
  TestSample, 
  TestKit,
  TestBooking,
  CreateTestSampleDto, 
  ApiResponse,
  SampleCollectionMethod 
} from '@/types';

// GET - Get all samples
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

    // Only Staff, Manager, Admin can view all samples
    if (!['Staff', 'Manager', 'Admin'].includes(payload.role)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền truy cập', statusCode: 403 },
        { status: 403 }
      );
    }

    const samplesSnapshot = await adminDb
      .collection(COLLECTIONS.testSamples)
      .orderBy('createdAt', 'desc')
      .get();

    const samples: TestSample[] = samplesSnapshot.docs.map(doc => doc.data() as TestSample);

    return NextResponse.json<ApiResponse<TestSample[]>>(
      { data: samples, message: 'Lấy danh sách mẫu thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get samples error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// POST - Create sample
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

    const body: CreateTestSampleDto = await request.json();
    const { kitId, donorName, relationshipToSubject, sampleType } = body;

    // Validate required fields
    if (!kitId || !donorName || relationshipToSubject === undefined || sampleType === undefined) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng điền đầy đủ thông tin', statusCode: 400 },
        { status: 400 }
      );
    }

    // Get kit
    const kitDoc = await adminDb.collection(COLLECTIONS.testKits).doc(kitId).get();

    if (!kitDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy kit', statusCode: 404 },
        { status: 404 }
      );
    }

    const kit = kitDoc.data() as TestKit;

    // Get booking to check permission
    const bookingDoc = await adminDb
      .collection(COLLECTIONS.testBookings)
      .doc(kit.bookingId)
      .get();

    if (!bookingDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy đặt lịch', statusCode: 404 },
        { status: 404 }
      );
    }

    const booking = bookingDoc.data() as TestBooking;

    // Check permission based on collection method
    if (kit.collectionMethod === SampleCollectionMethod.SelfSample) {
      // For self-sample: only the booking owner can create samples
      if (payload.role === 'Client' && booking.clientId !== payload.userId) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Không có quyền tạo mẫu cho đặt lịch này', statusCode: 403 },
          { status: 403 }
        );
      }
    } else {
      // For AtFacility: only Staff can create samples
      if (!['Staff', 'Manager', 'Admin'].includes(payload.role)) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Chỉ nhân viên mới có thể tạo mẫu cho lấy mẫu tại cơ sở', statusCode: 403 },
          { status: 403 }
        );
      }
    }

    // Check sample count limit
    const existingSamplesSnapshot = await adminDb
      .collection(COLLECTIONS.testSamples)
      .where('kitId', '==', kitId)
      .get();

    if (existingSamplesSnapshot.size >= kit.sampleCount) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: `Kit này chỉ cho phép ${kit.sampleCount} mẫu`, statusCode: 400 },
        { status: 400 }
      );
    }

    // Create sample
    const sampleData: Omit<TestSample, 'id' | 'createdAt' | 'updatedAt'> = {
      kitId,
      sampleCode: generateSampleCode(),
      donorName,
      relationshipToSubject,
      sampleType,
      collectedById: ['Staff', 'Manager', 'Admin'].includes(payload.role) ? payload.userId : undefined,
      collectedAt: new Date()
    };

    const sampleId = await createDocument(COLLECTIONS.testSamples, sampleData);

    return NextResponse.json<ApiResponse<{ sampleId: string; sampleCode: string }>>(
      { 
        data: { sampleId, sampleCode: sampleData.sampleCode }, 
        message: 'Tạo mẫu thành công', 
        statusCode: 201 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Create sample error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
