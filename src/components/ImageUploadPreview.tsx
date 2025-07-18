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

    // 2단계 업로드 진행
    const uploadImage = async () => {
      const startTime = Date.now();
      console.log('🚀 Starting 2-stage upload:', file.name, file.size, 'bytes');

      try {
        // 파일 크기 검사
        if (file.size > 100 * 1024 * 1024) { // 100MB 제한
          throw new Error('파일 크기가 너무 큽니다. 최대 100MB까지 업로드 가능합니다.');
        }

        // 1단계: 직접 Blob 업로드
        setStatusMessage('클라우드 스토리지에 업로드 중...');
        setProgress(10);

        console.log('📤 Stage 1: Direct blob upload');
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const uploadResponse = await fetch('/api/photography/upload-direct', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          console.error('❌ Direct upload failed:', uploadResponse.status, errorData);
          throw new Error(errorData.error || `업로드 실패 (${uploadResponse.status})`);
        }

        const uploadData = await uploadResponse.json();
        console.log('✅ Stage 1 complete:', uploadData);
        
        setProgress(50);
        setStatusMessage('이미지 처리 중...');

        // 2단계: 메타데이터 처리 (EXIF 추출 및 리사이즈)
        console.log('🔄 Stage 2: Processing metadata and resizing');
        const processResponse = await fetch('/api/photography/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_url: uploadData.file_url,
            file_id: uploadData.file_id,
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
        console.log('✅ Stage 2 complete:', processData);

        setProgress(90);
        setStatusMessage('완료 중...');

        // 성능 로깅
        const totalTime = Date.now() - startTime;
        console.log(`✅ Upload completed in ${totalTime}ms`);

        setProgress(100);
        setStatusMessage('완료!');
        
        setTimeout(() => {
          onUploadComplete(processData.file_url_service, processData.exif);
        }, 500);

      } catch (error: any) {
        const totalTime = Date.now() - startTime;
        console.error(`❌ Upload failed after ${totalTime}ms:`, error);
        
        let errorMessage = '이미지 업로드 중 오류가 발생했습니다.';
        
        if (error instanceof Error) {
          if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = '네트워크 연결을 확인하고 다시 시도해주세요.';
          } else if (error.message.includes('timeout') || error.message.includes('시간이 초과')) {
            errorMessage = '업로드 시간이 초과되었습니다. 파일 크기를 줄이고 다시 시도해주세요.';
          } else if (error.message.includes('크기가 너무')) {
            errorMessage = error.message;
          } else if (error.message && error.message !== 'Upload failed') {
            errorMessage = error.message;
          }
        }

        setStatusMessage('업로드 실패');
        onUploadError(errorMessage);
      } finally {
        setIsUploading(false);
      }
    };

    uploadImage();

    // 클린업
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, onUploadComplete, onUploadError]);

  // 프로그레스 바 애니메이션
  useEffect(() => {
    if (isUploading && progress > 0) {
      const timer = setTimeout(() => {
        if (progress < 90) {
          setProgress(prev => Math.min(prev + 1, 90));
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isUploading, progress]);

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
            {statusMessage} ({progress}%)
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