// GET /api/blogs - Get all blogs (public: published only, admin: all)
// POST /api/blogs - Create blog (Staff/Admin only)

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, COLLECTIONS } from '@/lib/firebase/admin';
import { verifyToken } from '@/lib/utils';
import { createDocument } from '@/lib/firebase/firestore';
import { 
  Blog, 
  User,
  Tag,
  ApiResponse,
  BlogStatus 
} from '@/types';

// GET - Get all blogs
export async function GET(request: NextRequest) {
  try {
    // Check if authenticated (optional for public blogs)
    const authHeader = request.headers.get('authorization');
    let payload = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      payload = verifyToken(token);
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    let query: FirebaseFirestore.Query = adminDb.collection(COLLECTIONS.blogs);

    // Public users can only see published blogs
    if (!payload || !['Staff', 'Manager', 'Admin'].includes(payload.role)) {
      query = query.where('isPublished', '==', true);
    } else if (status !== null) {
      // Staff/Admin can filter by status
      query = query.where('isPublished', '==', status === 'published');
    }

    query = query.orderBy('createdAt', 'desc');

    const blogsSnapshot = await query.get();
    const allBlogs = blogsSnapshot.docs;
    
    // Manual pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDocs = allBlogs.slice(startIndex, endIndex);

    const blogs: Blog[] = [];

    for (const doc of paginatedDocs) {
      const blogData = doc.data() as Blog;
      
      // Get author info
      if (blogData.authorId) {
        const authorDoc = await adminDb
          .collection(COLLECTIONS.users)
          .doc(blogData.authorId)
          .get();
        
        if (authorDoc.exists) {
          const author = authorDoc.data() as User;
          blogData.author = {
            id: author.id,
            fullName: author.fullName,
            email: author.email,
            phone: author.phone,
            address: author.address,
            role: author.role,
            isActive: author.isActive,
            createdAt: author.createdAt
          };
        }
      }

      // Get tags
      const blogTagsSnapshot = await adminDb
        .collection('blogTags')
        .where('blogId', '==', blogData.id)
        .get();

      if (!blogTagsSnapshot.empty) {
        const tagIds = blogTagsSnapshot.docs.map(d => d.data().tagId);
        const tags: Tag[] = [];
        
        for (const tagId of tagIds) {
          const tagDoc = await adminDb.collection(COLLECTIONS.tags).doc(tagId).get();
          if (tagDoc.exists) {
            tags.push(tagDoc.data() as Tag);
          }
        }
        
        blogData.tags = tags;
      }

      blogs.push(blogData);
    }

    return NextResponse.json<ApiResponse<{
      blogs: Blog[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>>(
      { 
        data: {
          blogs,
          pagination: {
            page,
            limit,
            total: allBlogs.length,
            totalPages: Math.ceil(allBlogs.length / limit)
          }
        }, 
        message: 'Lấy danh sách blog thành công', 
        statusCode: 200 
      },
      { status: 200 }
    );

  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}

// POST - Create blog
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

    // Only Staff, Manager, Admin can create blogs
    if (!['Staff', 'Manager', 'Admin'].includes(payload.role)) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Không có quyền tạo blog', statusCode: 403 },
        { status: 403 }
      );
    }

    const body: {
      title: string;
      content: string;
      summary?: string;
      imageUrl?: string;
      tagIds?: string[];
      isPublished?: boolean;
    } = await request.json();

    const { title, content, summary, imageUrl, tagIds, isPublished } = body;

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, message: 'Tiêu đề và nội dung không được để trống', statusCode: 400 },
        { status: 400 }
      );
    }

    // Create blog
    const blogData: Omit<Blog, 'id' | 'createdAt' | 'updatedAt'> = {
      title,
      content,
      summary: summary || content.substring(0, 200) + '...',
      imageUrl: imageUrl || '',
      authorId: payload.userId,
      isPublished: isPublished || false,
      publishedAt: isPublished ? new Date() : undefined
    };

    const blogId = await createDocument(COLLECTIONS.blogs, blogData);

    // Create blog-tag relationships
    if (tagIds && tagIds.length > 0) {
      const batch = adminDb.batch();
      
      for (const tagId of tagIds) {
        const blogTagRef = adminDb.collection('blogTags').doc();
        batch.set(blogTagRef, {
          id: blogTagRef.id,
          blogId,
          tagId,
          createdAt: new Date()
        });
      }
      
      await batch.commit();
    }

    return NextResponse.json<ApiResponse<{ blogId: string }>>(
      { data: { blogId }, message: 'Tạo blog thành công', statusCode: 201 },
      { status: 201 }
    );

  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, message: 'Lỗi máy chủ', statusCode: 500 },
      { status: 500 }
    );
  }
}
