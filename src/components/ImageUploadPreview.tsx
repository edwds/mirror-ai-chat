'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';

interface ImageUploadPreviewProps {
  file: File;
  onUploadComplete: (url: string) => void;
  onUploadError: (error: string) => void;
}

export function ImageUploadPreview({ file, onUploadComplete, onUploadError }: ImageUploadPreviewProps) {
  const [preview, setPreview] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(true);

  useEffect(() => {
    // 파일 미리보기 URL 생성
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // 업로드 진행
    const uploadImage = async () => {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/photography/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('업로드 실패');
        }

        const data = await response.json();
        onUploadComplete(data.file_url_service);
      } catch (error) {
        console.error('Upload error:', error);
        onUploadError('이미지 업로드 중 오류가 발생했습니다.');
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
    if (isUploading) {
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(timer);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      return () => clearInterval(timer);
    } else {
      setProgress(100);
    }
  }, [isUploading]);

  return (
    <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
      {preview && (
        <Image
          src={preview}
          alt="Upload preview"
          fill
          className="object-cover"
        />
      )}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50">
        <Progress value={progress} className="h-1" />
      </div>
    </div>
  );
} 