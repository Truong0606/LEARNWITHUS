// GET /api/sample-instructions - Get all sample instructions
// POST /api/sample-instructions - Create instruction (Staff/Admin only)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { createDocument } from '@/lib/firebase/firestore';
import { 
  SampleTypeInstruction, 
  SampleType,
  ApiResponse 
} from '@/types';

// GET - Get all sample instructions
export async function GET(request: NextRequest) {
  try {
    // Parse query params
    const { searchParams } = new URL(request.url);
    const sampleType = searchParams.get('sampleType');

    let query: FirebaseFirestore.Query = adminDb.collection(COLLECTIONS.sampleInstructions);

    if (sampleType !== null) {
      query = query.where('sampleType', '==', parseInt(sampleType));
    }

    query = query.orderBy('sampleType', 'asc');

    const instructionsSnapshot = await query.get();
    const instructions: SampleTypeInstruction[] = instructionsSnapshot.docs.map(
      doc => doc.data() as SampleTypeInstruction
    );

    return NextResponse.json<ApiResponse<SampleTypeInstruction[]>>(
      { data: instructions, message: 'Lấy danh sách hướng dẫn thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get sample instructions error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// POST - Create sample instruction
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

    // Only Staff, Manager, Admin can create instructions
    if (!['Staff', 'Manager', 'Admin'].includes(payload.role)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền tạo hướng dẫn', statusCode: 403 },
        { status: 403 }
      );
    }

    const body: {
      sampleType: SampleType;
      title: string;
      instructions: string;
      videoUrl?: string;
      imageUrls?: string[];
    } = await request.json();

    const { sampleType, title, instructions, videoUrl, imageUrls } = body;

    // Validate required fields
    if (sampleType === undefined || !title || !instructions) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Vui lòng điền đầy đủ thông tin', statusCode: 400 },
        { status: 400 }
      );
    }

    // Check if instruction for this sample type already exists
    const existingSnapshot = await adminDb
      .collection(COLLECTIONS.sampleInstructions)
      .where('sampleType', '==', sampleType)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Hướng dẫn cho loại mẫu này đã tồn tại', statusCode: 400 },
        { status: 400 }
      );
    }

    // Create instruction
    const instructionData: Omit<SampleTypeInstruction, 'id' | 'createdAt' | 'updatedAt'> = {
      sampleType,
      title,
      instructions,
      videoUrl: videoUrl || undefined,
      imageUrls: imageUrls || []
    };

    const instructionId = await createDocument(COLLECTIONS.sampleInstructions, instructionData);

    return NextResponse.json<ApiResponse<{ instructionId: string }>>(
      { data: { instructionId }, message: 'Tạo hướng dẫn thành công', statusCode: 201 },
      { status: 201 }
    );

  } catch (error) {
    console.error('Create sample instruction error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
