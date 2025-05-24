'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ImageUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 검사
    if (!file.type.startsWith('image/')) {
      return;
    }

    // 파일 크기 검사 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      return;
    }

    setIsUploading(true);

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
      
      // TODO: 업로드된 이미지 처리 (예: 미리보기 표시)
      console.log('Uploaded image:', data);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="flex flex-col items-center gap-4">
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={isUploading}
          className="cursor-pointer"
        />
        {isUploading && (
          <div className="text-sm text-gray-500">업로드 중...</div>
        )}
      </div>
    </div>
  );
} 