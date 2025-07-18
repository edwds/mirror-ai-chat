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
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 검사 (100MB 제한)
    if (file.size > 100 * 1024 * 1024) {
      alert('파일 크기가 너무 큽니다. 최대 100MB까지 업로드 가능합니다.');
      return;
    }

    setIsUploading(true);

    try {
      // 1단계: 직접 Blob 업로드
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const uploadResponse = await fetch('/api/photography/upload-direct', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('직접 업로드 실패');
      }

      const uploadData = await uploadResponse.json();

      // 2단계: 메타데이터 처리
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
        throw new Error('이미지 처리 실패');
      }

      const processData = await processResponse.json();
      
      // TODO: 업로드된 이미지 처리 (예: 미리보기 표시)
      console.log('Uploaded image:', processData);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
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