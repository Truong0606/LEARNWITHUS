// GET /api/sample-instructions/type/[sampleType] - Get instruction by sample type

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { 
  SampleTypeInstruction,
  ApiResponse 
} from '@/types';

interface RouteContext {
  params: Promise<{ sampleType: string }>;
}

// GET - Get instruction by sample type
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { sampleType } = await context.params;
    const sampleTypeNum = parseInt(sampleType);

    if (isNaN(sampleTypeNum)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Loại mẫu không hợp lệ', statusCode: 400 },
        { status: 400 }
      );
    }

    const instructionsSnapshot = await adminDb
      .collection(COLLECTIONS.sampleInstructions)
      .where('sampleType', '==', sampleTypeNum)
      .limit(1)
      .get();

    if (instructionsSnapshot.empty) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không tìm thấy hướng dẫn cho loại mẫu này', statusCode: 404 },
        { status: 404 }
      );
    }

    const instruction = instructionsSnapshot.docs[0].data() as SampleTypeInstruction;

    return NextResponse.json<ApiResponse<SampleTypeInstruction>>(
      { data: instruction, message: 'Lấy hướng dẫn thành công', statusCode: 200 },
      { status: 200 }
    );

  } catch (error) {
    console.error('Get sample instruction by type error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
