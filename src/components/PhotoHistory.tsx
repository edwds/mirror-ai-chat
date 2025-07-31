"use client";

import React, { useState, useEffect } from 'react';
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Camera, Image as ImageIcon } from "lucide-react";

interface Photo {
  id: string;
  originalName: string;
  serviceUrl: string;
  llmUrl: string;
  exif: {
    brand?: string;
    model?: string;
    lens?: string;
    aperture?: string;
    shutter?: string;
    iso?: string;
  };
  createdAt: string;
}

interface PhotoHistoryProps {
  onPhotoSelect: (photo: Photo) => void;
  selectedAction?: string | null;
}

export function PhotoHistory({ onPhotoSelect, selectedAction }: PhotoHistoryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPhotoHistory();
  }, []);

  const fetchPhotoHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/photography/history?limit=5');
      
      if (!response.ok) {
        throw new Error('사진 히스토리를 불러올 수 없습니다');
      }
      
      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '오늘';
    } else if (diffDays === 1) {
      return '어제';
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getActionText = (action?: string | null) => {
    const actionMap: Record<string, string> = {
      'photo-review': '사진 평가',
      'reference-analysis': '레퍼런스 분석',
      'color-analysis': '색감 추출'
    };
    return action ? actionMap[action] || '분석' : '분석';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <ImageIcon className="w-8 h-8 mb-2 animate-pulse" />
        <p>사진을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-red-500">
        <ImageIcon className="w-8 h-8 mb-2" />
        <p>{error}</p>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchPhotoHistory}
          className="mt-2"
        >
          다시 시도
        </Button>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <ImageIcon className="w-8 h-8 mb-2" />
        <p>아직 업로드한 사진이 없습니다</p>
        <p className="text-sm text-gray-400 mt-1">첫 번째 사진을 업로드해보세요!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Clock className="w-4 h-4" />
        <span>최근 업로드한 사진</span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {photos.map((photo, index) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card 
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200 hover:border-gray-300"
              onClick={() => onPhotoSelect(photo)}
            >
              <div className="flex items-center gap-4">
                {/* 썸네일 */}
                <div className="flex-shrink-0">
                  <img
                    src={photo.serviceUrl}
                    alt={photo.originalName || '업로드된 사진'}
                    className="w-16 h-16 object-cover rounded-lg bg-gray-100"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm text-gray-900 truncate">
                      {photo.originalName || '사진'}
                    </h4>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatDate(photo.createdAt)}
                    </span>
                  </div>
                  
                  {/* EXIF 정보 */}
                  {(photo.exif.brand || photo.exif.model) && (
                    <div className="flex items-center gap-1 mt-1">
                      <Camera className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {photo.exif.brand} {photo.exif.model}
                      </span>
                    </div>
                  )}

                  {/* 액션 버튼 */}
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-3 text-xs bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                    >
                      {getActionText(selectedAction)}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}