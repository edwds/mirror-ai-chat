'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

export function ImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 검사
    if (!file.type.startsWith('image/')) {
      toast({
        title: '오류',
        description: '이미지 파일만 업로드 가능합니다.',
        variant: 'destructive',
      });
      return;
    }

    // 파일 크기 검사 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: '오류',
        description: '파일 크기는 10MB를 초과할 수 없습니다.',
        variant: 'destructive',
      });
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
      
      toast({
        title: '성공',
        description: '이미지가 성공적으로 업로드되었습니다.',
      });

      // TODO: 업로드된 이미지 처리 (예: 미리보기 표시)
      console.log('Uploaded image:', data);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: '오류',
        description: '이미지 업로드 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
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