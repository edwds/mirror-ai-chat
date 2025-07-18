import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// Vercel 함수 설정
export const runtime = 'nodejs';
export const maxDuration = 30;

// 임시 저장소 (실제로는 Redis나 DB 사용 권장)
const chunkStore = new Map<string, { chunks: Buffer[], totalChunks: number, metadata: any }>();

export async function POST(req: Request) {
  try {
    // 1. 인증된 사용자 정보 가져오기
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. 폼 데이터 파싱
    const formData = await req.formData();
    const chunk = formData.get('chunk') as File;
    const uploadId = formData.get('uploadId') as string;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string);
    const totalChunks = parseInt(formData.get('totalChunks') as string);
    const originalName = formData.get('originalName') as string;
    const totalSize = parseInt(formData.get('totalSize') as string);

    if (!chunk || !uploadId || isNaN(chunkIndex) || isNaN(totalChunks)) {
      return NextResponse.json({ error: 'Invalid chunk data' }, { status: 400 });
    }

      console.log(`📦 Received chunk ${chunkIndex + 1}/${totalChunks} for upload ${uploadId}`);

      // 3. 청크를 버퍼로 변환 (빈 청크는 상태 확인용)
      const chunkBuffer = Buffer.from(await chunk.arrayBuffer());
      const isStatusCheck = chunkBuffer.length === 0;

      // 4. 상태 확인 요청인 경우 기존 데이터 확인
      if (isStatusCheck) {
        console.log(`🔍 Status check for upload ${uploadId}`);
        
        if (!chunkStore.has(uploadId)) {
          // 데이터가 없으면 이미 완료되었을 가능성
          return NextResponse.json({
            success: true,
            completed: true,
            message: 'Upload already completed'
          });
        }
        
        const uploadData = chunkStore.get(uploadId)!;
        const receivedChunks = uploadData.chunks.filter(chunk => chunk !== undefined).length;
        
        if (receivedChunks === totalChunks) {
          // 모든 청크가 있으면 조립 수행
          console.log('🔧 Status check triggered file assembly...');
          
          const completeFile = Buffer.concat(uploadData.chunks);
          const fileExtension = originalName.split('.').pop() || 'jpg';
          
          // Vercel Blob에 업로드
          const fileId = uploadId;
          const blob = await put(`uploads/${userId}/${fileId}/original.${fileExtension}`, completeFile, {
            access: 'public',
          });

          // 임시 데이터 정리
          chunkStore.delete(uploadId);

          console.log('✅ File assembled via status check:', blob.url);

          return NextResponse.json({
            success: true,
            completed: true,
            file_url: blob.url,
            file_id: fileId,
            metadata: uploadData.metadata
          });
        } else {
          return NextResponse.json({
            success: true,
            completed: false,
            received: receivedChunks,
            total: totalChunks,
            message: 'Still waiting for chunks'
          });
        }
      }

      // 5. 일반 청크 저장
      if (!chunkStore.has(uploadId)) {
        chunkStore.set(uploadId, {
          chunks: new Array(totalChunks),
          totalChunks,
          metadata: { originalName, totalSize, userId }
        });
      }

      const uploadData = chunkStore.get(uploadId)!;
      uploadData.chunks[chunkIndex] = chunkBuffer;

      // 6. 모든 청크가 도착했는지 확인
      const receivedChunks = uploadData.chunks.filter(chunk => chunk !== undefined).length;
      console.log(`📊 Progress: ${receivedChunks}/${totalChunks} chunks received`);

      if (receivedChunks === totalChunks) {
        // 모든 청크가 도착했으면 파일 재조립
        console.log('🔧 All chunks received, assembling file...');
        
        const completeFile = Buffer.concat(uploadData.chunks);
        const fileExtension = originalName.split('.').pop() || 'jpg';
        
        // Vercel Blob에 업로드
        const fileId = uploadId;
        const blob = await put(`uploads/${userId}/${fileId}/original.${fileExtension}`, completeFile, {
          access: 'public',
        });

        // 임시 데이터 정리
        chunkStore.delete(uploadId);

        console.log('✅ File assembled and uploaded to Blob:', blob.url);

        return NextResponse.json({
          success: true,
          completed: true,
          file_url: blob.url,
          file_id: fileId,
          metadata: uploadData.metadata
        });
      } else {
        // 아직 더 기다려야 함
        return NextResponse.json({
          success: true,
          completed: false,
          received: receivedChunks,
          total: totalChunks
        });
      }

  } catch (error) {
    console.error('Error in chunk upload:', error);
    return NextResponse.json(
      { error: 'Chunk upload failed' },
      { status: 500 }
    );
  }
} 