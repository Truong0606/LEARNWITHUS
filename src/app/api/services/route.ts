// GET /api/services - Get all services with prices
// POST /api/services - Create new service (Admin only)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { createDocument } from '@/lib/firebase/firestore';
import { 
  TestService, 
  ServicePrice, 
  CreateTestServiceDto, 
  ApiResponse,
  SampleCollectionMethod,
  TestServiceType
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

// GET - Get all services with their prices
export async function GET(request: NextRequest) {
  try {
    // Get all active service prices with their service info
    const pricesSnapshot = await adminDb
      .collection(COLLECTIONS.servicePrices)
      .where('effectiveTo', '==', null)
      .get();

    const servicePrices: Array<ServicePrice & { testServiceInfor?: TestService }> = [];

    for (const doc of pricesSnapshot.docs) {
      const priceData = doc.data() as ServicePrice;
      
      // Get the associated service
      const serviceDoc = await adminDb
        .collection(COLLECTIONS.testServices)
        .doc(priceData.serviceId)
        .get();

      if (serviceDoc.exists) {
        const serviceData = serviceDoc.data() as TestService;
        
        // Only include active services
        if (serviceData.isActive) {
          servicePrices.push({
            ...priceData,
            testServiceInfor: serviceData
          });
        }
      }
    }

    servicePrices.sort((a, b) => getCreatedAtMs(b.createdAt) - getCreatedAtMs(a.createdAt));

    return NextResponse.json<ApiResponse<typeof servicePrices>>(
      { 
        data: servicePrices, 
        message: 'Lấy danh sách dịch vụ thành công', 
        statusCode: 200 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get services error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// POST - Create new service (Admin/Manager only)
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

    const body: CreateTestServiceDto = await request.json();
    const { name, description, sampleCount, type, prices, imageUrl, features } = body;

    // Validate required fields
    if (!name || !description || sampleCount === undefined || type === undefined || !prices?.length) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng điền đầy đủ thông tin', statusCode: 400 },
        { status: 400 }
      );
    }

    // Legal services cannot have self-sample collection method
    if (type === TestServiceType.Legal) {
      const hasSelfSample = prices.some(p => p.collectionMethod === SampleCollectionMethod.SelfSample);
      if (hasSelfSample) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, message: 'Không thể tạo dịch vụ pháp lý với phương thức tự lấy mẫu', statusCode: 400 },
          { status: 400 }
        );
      }
    }

    // Create the test service
    const serviceData: Omit<TestService, 'id' | 'createdAt' | 'updatedAt'> = {
      name: name.trim(),
      description: description.trim(),
      sampleCount,
      type,
      isActive: true,
      imageUrl: imageUrl?.trim() || undefined,
      features: features?.filter((feature) => feature.trim().length > 0).map((feature) => feature.trim())
    };

    const serviceId = await createDocument(COLLECTIONS.testServices, serviceData);

    // Create service prices
    for (const priceInfo of prices) {
      const priceData: Omit<ServicePrice, 'id' | 'createdAt' | 'updatedAt'> = {
        serviceId,
        price: priceInfo.price,
        collectionMethod: priceInfo.collectionMethod,
        effectiveFrom: new Date(),
        effectiveTo: null
      };
      await createDocument(COLLECTIONS.servicePrices, priceData);
    }

    return NextResponse.json<ApiResponse<{ serviceId: string }>>(
      { 
        data: { serviceId }, 
        message: 'Tạo dịch vụ thành công', 
        statusCode: 201 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

