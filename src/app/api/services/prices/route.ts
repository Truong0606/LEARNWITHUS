// GET /api/services/prices - Get all service prices (with service info)
// POST /api/services/prices - Create new price (Admin/Manager only)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { createDocument } from '@/lib/firebase/firestore';
import { 
  ServicePrice, 
  TestService, 
  CreateServicePriceFullDto, 
  ApiResponse,
  SampleCollectionMethod 
} from '@/types';

const getCreatedAtMs = (value: unknown): number => {
  if (value instanceof Date) {
    return value.getTime();
  }
  if (value && typeof value === 'object' && 'toDate' in value) {
    const date = (value as { toDate: () => Date }).toDate();
    return date.getTime();
  }
  return 0;
};

// Collection method labels
const collectionMethodLabels: Record<SampleCollectionMethod, string> = {
  [SampleCollectionMethod.SelfSample]: 'SelfSample',
  [SampleCollectionMethod.AtFacility]: 'AtFacility'
};

// GET - Get all service prices with service info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    // Build query
    let query: FirebaseFirestore.Query = adminDb.collection(COLLECTIONS.servicePrices);

    // Filter by serviceId if provided
    if (serviceId) {
      query = query.where('serviceId', '==', serviceId);
    }

    // Filter active prices (no effectiveTo or effectiveTo in future)
    if (activeOnly) {
      query = query.where('effectiveTo', '==', null);
    }

    const pricesSnapshot = await query.get();

    // Get service info for each price
    const pricesWithService: Array<ServicePrice & { 
      testServiceInfor?: TestService;
      collectionMethodLabel: string;
    }> = [];

    for (const doc of pricesSnapshot.docs) {
      const priceData = doc.data() as ServicePrice;
      
      // Get associated service
      const serviceDoc = await adminDb
        .collection(COLLECTIONS.testServices)
        .doc(priceData.serviceId)
        .get();

      let serviceData: TestService | undefined;
      
      if (serviceDoc.exists) {
        serviceData = serviceDoc.data() as TestService;
        
        // Skip if service is not active and we want active only
        if (activeOnly && !serviceData.isActive) {
          continue;
        }
      }

      pricesWithService.push({
        ...priceData,
        testServiceInfor: serviceData,
        collectionMethodLabel: collectionMethodLabels[priceData.collectionMethod] || 'Unknown'
      });
    }

    pricesWithService.sort((a, b) => getCreatedAtMs(b.createdAt) - getCreatedAtMs(a.createdAt));

    return NextResponse.json<ApiResponse<typeof pricesWithService>>(
      { data: pricesWithService, message: 'Lấy danh sách giá dịch vụ thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get prices error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// POST - Create new price
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

    // Check role (Admin or Manager only)
    if (payload.role !== 'Admin' && payload.role !== 'Manager') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền truy cập', statusCode: 403 },
        { status: 403 }
      );
    }

    const body: CreateServicePriceFullDto = await request.json();
    const { serviceId, price, collectionMethod, effectiveFrom, effectiveTo } = body;

    // Validate required fields
    if (!serviceId || price === undefined || collectionMethod === undefined) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng điền đầy đủ thông tin', statusCode: 400 },
        { status: 400 }
      );
    }

    // Check if service exists
    const serviceDoc = await adminDb.collection(COLLECTIONS.testServices).doc(serviceId).get();
    if (!serviceDoc.exists) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy dịch vụ', statusCode: 404 },
        { status: 404 }
      );
    }

    // Create price
    const priceData: Omit<ServicePrice, 'id' | 'createdAt' | 'updatedAt'> = {
      serviceId,
      price,
      collectionMethod,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      effectiveTo: effectiveTo ? new Date(effectiveTo) : null
    };

    const priceId = await createDocument(COLLECTIONS.servicePrices, priceData);

    return NextResponse.json<ApiResponse<{ priceId: string }>>(
      { data: { priceId }, message: 'Tạo giá dịch vụ thành công', statusCode: 201 },
      { status: 201 }
    );

  } catch (error) {
    console.error('Create price error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

