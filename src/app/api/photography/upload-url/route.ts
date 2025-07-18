import { handleUpload } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// Vercel 함수 설정
export const runtime = 'nodejs';
export const maxDuration = 10;

export async function POST(req: Request) {
  try {
    // 1. 인증된 사용자 정보 가져오기
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. handleUpload를 사용하여 클라이언트 업로드 URL 생성
    const jsonResponse = await handleUpload({
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // 업로드 전 검증 로직
        console.log('Upload requested:', { pathname, clientPayload });
        
        // 클라이언트에서 전달한 데이터 검증
        if (clientPayload) {
          const { fileSize } = clientPayload as any;
          if (fileSize && fileSize > 100 * 1024 * 1024) {
            throw new Error('파일 크기가 너무 큽니다. 최대 100MB까지 업로드 가능합니다.');
          }
        }

        // 인증된 사용자만 업로드 허용
        return {
          allowedContentTypes: ['image/*'],
          tokenPayload: {
            userId: session.user.id,
            timestamp: Date.now(),
          },
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // 업로드 완료 후 처리
        console.log('Upload completed:', { blob, tokenPayload });
        
        // 여기서 DB에 저장하거나 추가 처리 가능
        // 하지만 지금은 클라이언트에서 처리하도록 함
      },
    });

    return jsonResponse;

  } catch (error) {
    console.error('Error in handleUpload:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
} 