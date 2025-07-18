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
  const [status, setStatus] = useState<string>('파일 준비 중...');

  useEffect(() => {
    // 파일 미리보기 URL 생성
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // 업로드 진행
    const uploadImage = async () => {
      const startTime = Date.now();
      console.log('📤 Starting upload:', file.name, file.size, 'bytes');
      
      try {
        // 파일 크기 사전 체크 (클라이언트 사이드)
        const MAX_SIZE = 20 * 1024 * 1024; // 20MB
        if (file.size > MAX_SIZE) {
          throw new Error(`파일 크기가 너무 큽니다. 최대 ${MAX_SIZE / 1024 / 1024}MB까지 업로드 가능합니다.`);
        }

        setStatus('업로드 준비 중...');
        setProgress(10);

        const formData = new FormData();
        formData.append('file', file);

        setStatus('서버로 전송 중...');
        setProgress(30);

        // 타임아웃 설정 (30초)
        const timeoutId = setTimeout(() => {
          throw new Error('업로드 시간이 초과되었습니다. 파일 크기를 줄이고 다시 시도해주세요.');
        }, 30000);

        const response = await fetch('/api/photography/upload', {
          method: 'POST',
          body: formData,
        });

        clearTimeout(timeoutId);

        setStatus('서버 응답 처리 중...');
        setProgress(70);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Upload failed with status:', response.status, errorData);
          
          // 서버에서 제공한 에러 메시지 사용
          const errorMessage = errorData.error || `업로드 실패 (${response.status})`;
          throw new Error(errorMessage);
        }

        setStatus('이미지 처리 완료...');
        setProgress(90);

        const data = await response.json();
        console.log('✅ Upload successful:', data);
        
        // 성능 정보 로깅 (개발 환경에서만)
        if (data.performance && process.env.NODE_ENV === 'development') {
          console.log('📊 Upload performance:', data.performance);
        }

        setProgress(100);
        setStatus('완료!');
        
        // 약간의 지연 후 완료 콜백 호출
        setTimeout(() => {
          onUploadComplete(data.file_url_service, data.exif);
        }, 500);
        
      } catch (error: any) {
        const uploadTime = Date.now() - startTime;
        console.error(`❌ Upload failed after ${uploadTime}ms:`, error);
        
        let errorMessage = '이미지 업로드 중 오류가 발생했습니다.';
        
        if (error instanceof Error) {
          // 네트워크 에러 처리
          if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = '네트워크 연결을 확인하고 다시 시도해주세요.';
          } 
          // 타임아웃 에러 처리
          else if (error.message.includes('timeout') || error.message.includes('시간이 초과')) {
            errorMessage = '업로드 시간이 초과되었습니다. 파일 크기를 줄이고 다시 시도해주세요.';
          }
          // 파일 크기 에러 처리
          else if (error.message.includes('크기가 너무')) {
            errorMessage = error.message;
          }
          // 서버에서 제공한 구체적인 에러 메시지 사용
          else if (error.message && error.message !== 'Upload failed') {
            errorMessage = error.message;
          }
        }
        
        setStatus('업로드 실패');
        onUploadError(errorMessage);
      } finally {
        setIsUploading(false);
      }
    };

    uploadImage();

    // 클린업
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, onUploadComplete, onUploadError]);

  // 프로그레스 바 애니메이션 (실제 업로드 진행률 반영)
  useEffect(() => {
    if (isUploading && progress > 0) {
      // 진행률이 설정된 경우에만 부드러운 애니메이션 적용
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
        {/* 업로드 오버레이 */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <div className="text-sm">{status}</div>
            </div>
          </div>
        )}
      </div>

      {/* 진행률 표시 */}
      {isUploading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-gray-500 text-center">
            {status} ({progress}%)
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