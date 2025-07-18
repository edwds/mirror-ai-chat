import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// Vercel 함수 설정
export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // 1. 인증된 사용자 정보 가져오기
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. 파일 파싱
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 3. 직접 Blob에 업로드
    const id = crypto.randomUUID();
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    
    // 원본 파일을 Blob에 직접 업로드
    const originalBlob = await put(
      `uploads/${userId}/${id}/original.${fileExtension}`, 
      file, 
      {
        access: 'public',
        addRandomSuffix: false,
      }
    );

    return NextResponse.json({
      success: true,
      file_url: originalBlob.url,
      file_id: id,
      user_id: userId,
      original_name: file.name,
      file_size: file.size,
    });

  } catch (error) {
    console.error('Error in direct upload:', error);
    return NextResponse.json(
      { error: 'Direct upload failed' },
      { status: 500 }
    );
  }
} 