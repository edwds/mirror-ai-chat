'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';

interface ImageUploadPreviewProps {
  file: File;
  onUploadComplete: (url: string, exif?: any) => void;
  onUploadError: (error: string) => void;
}

export function ImageUploadPreview({ file, onUploadComplete, onUploadError }: ImageUploadPreviewProps) {
  const [preview, setPreview] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('파일 준비 중...');

  useEffect(() => {
    // 파일 미리보기 URL 생성
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Chunk 업로드 구현
    const uploadImageWithChunks = async () => {
      const startTime = Date.now();
      console.log('🚀 Starting chunk upload:', file.name, file.size, 'bytes');

      try {
        // 파일 크기 검사
        if (file.size > 100 * 1024 * 1024) {
          throw new Error('파일 크기가 너무 큽니다. 최대 100MB까지 업로드 가능합니다.');
        }

        const CHUNK_SIZE = 3 * 1024 * 1024; // 3MB chunks (4.5MB 제한보다 작게)
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const uploadId = crypto.randomUUID();

        console.log(`📦 File will be split into ${totalChunks} chunks of ${CHUNK_SIZE / 1024 / 1024}MB each`);

        setStatusMessage(`파일을 ${totalChunks}개 조각으로 나누어 업로드 중...`);
        setProgress(5);

        // 병렬 업로드를 위한 Promise 배열
        const uploadPromises: Promise<any>[] = [];

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          const start = chunkIndex * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);

          console.log(`📤 Preparing chunk ${chunkIndex + 1}/${totalChunks} (${start}-${end})`);

          const uploadChunk = async () => {
            const formData = new FormData();
            formData.append('chunk', chunk);
            formData.append('uploadId', uploadId);
            formData.append('chunkIndex', chunkIndex.toString());
            formData.append('totalChunks', totalChunks.toString());
            formData.append('originalName', file.name);
            formData.append('totalSize', file.size.toString());

            const response = await fetch('/api/photography/upload-chunk', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              throw new Error(`Chunk ${chunkIndex + 1} upload failed (${response.status})`);
            }

            const result = await response.json();
            console.log(`✅ Chunk ${chunkIndex + 1}/${totalChunks} uploaded:`, result);

            // 진행률 업데이트 (80%까지는 chunk 업로드)
            const chunkProgress = ((chunkIndex + 1) / totalChunks) * 75;
            setProgress(5 + chunkProgress);

            return result;
          };

          uploadPromises.push(uploadChunk());
        }

        // 모든 chunk 업로드 완료 대기
        setStatusMessage('모든 조각 업로드 완료 대기 중...');
        const results = await Promise.all(uploadPromises);
        
        // 마지막 응답에서 완료된 파일 URL 확인
        const completedResult = results.find(r => r.completed);
        if (!completedResult) {
          throw new Error('파일 조립이 완료되지 않았습니다.');
        }

        console.log('✅ All chunks uploaded and file assembled:', completedResult.file_url);
        
        setProgress(85);
        setStatusMessage('이미지 처리 중...');

        // EXIF 추출 및 리사이즈 처리
        const processResponse = await fetch('/api/photography/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_url: completedResult.file_url,
            file_id: completedResult.file_id,
            original_name: file.name,
            file_size: file.size,
          }),
        });

        if (!processResponse.ok) {
          const errorData = await processResponse.json().catch(() => ({}));
          console.error('❌ Processing failed:', processResponse.status, errorData);
          throw new Error(errorData.error || `이미지 처리 실패 (${processResponse.status})`);
        }

        const processData = await processResponse.json();
        console.log('✅ Image processing complete:', processData);

        const totalTime = Date.now() - startTime;
        console.log(`🎉 Total upload time: ${totalTime}ms`);

        setProgress(100);
        setStatusMessage('완료!');
        
        setTimeout(() => {
          onUploadComplete(processData.file_url_service, processData.exif);
        }, 500);

      } catch (error: any) {
        const totalTime = Date.now() - startTime;
        console.error(`❌ Chunk upload failed after ${totalTime}ms:`, error);
        
        let errorMessage = '이미지 업로드 중 오류가 발생했습니다.';
        
        if (error instanceof Error) {
          if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = '네트워크 연결을 확인하고 다시 시도해주세요.';
          } else if (error.message.includes('timeout') || error.message.includes('시간이 초과')) {
            errorMessage = '업로드 시간이 초과되었습니다. 파일 크기를 줄이고 다시 시도해주세요.';
          } else if (error.message.includes('크기가 너무')) {
            errorMessage = error.message;
          } else if (error.message && !error.message.includes('Upload failed')) {
            errorMessage = error.message;
          }
        }

        setStatusMessage('업로드 실패');
        onUploadError(errorMessage);
      } finally {
        setIsUploading(false);
      }
    };

    uploadImageWithChunks();

    // 클린업
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, onUploadComplete, onUploadError]);

  return (
    <div className="w-full">
      {/* 이미지 미리보기 */}
      <div className="relative aspect-square w-full max-w-sm mx-auto mb-4 rounded-lg overflow-hidden bg-gray-100">
        {preview && (
          <Image
            src={preview}
            alt="업로드 이미지 미리보기"
            fill
            className="object-cover"
            unoptimized
          />
        )}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <div className="text-sm">{statusMessage}</div>
            </div>
          </div>
        )}
      </div>

      {/* 진행 상태 */}
      {isUploading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-gray-500 text-center">
            {statusMessage} ({Math.round(progress)}%)
          </div>
        </div>
      )}

      {/* 파일 정보 */}
      <div className="text-xs text-gray-400 text-center mt-2">
        {file.name} • {(file.size / 1024 / 1024).toFixed(1)}MB
      </div>
    </div>
  );
} 