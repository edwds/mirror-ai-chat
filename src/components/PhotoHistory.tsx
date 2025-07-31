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
      const response = await fetch('/api/photography/history?limit=9');
      
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
    <div className="h-full overflow-y-auto space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Clock className="w-4 h-4" />
        <span>최근 업로드한 사진</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {photos.map((photo, index) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="aspect-square"
          >
            <div 
              className="relative w-full h-full cursor-pointer group rounded-lg overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors"
              onClick={() => onPhotoSelect(photo)}
            >
              {/* 사진 썸네일 */}
              <img
                src={photo.serviceUrl}
                alt={photo.originalName || '업로드된 사진'}
                className="w-full h-full object-cover bg-gray-100"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              
              {/* 호버 오버레이 */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200">
                <div className="absolute inset-0 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {/* 상단 - 날짜 */}
                  <div className="flex justify-end">
                    <span className="text-xs text-white bg-black/50 px-2 py-1 rounded-full">
                      {formatDate(photo.createdAt)}
                    </span>
                  </div>
                  
                  {/* 하단 - 정보 */}
                  <div className="text-white">
                    <h4 className="text-sm font-medium truncate mb-1">
                      {photo.originalName || '사진'}
                    </h4>
                    
                    {/* EXIF 정보 */}
                    {(photo.exif.brand || photo.exif.model) && (
                      <div className="flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        <span className="text-xs truncate">
                          {photo.exif.brand} {photo.exif.model}
                        </span>
                      </div>
                    )}
                    
                    {/* 액션 텍스트 */}
                    {selectedAction && (
                      <div className="mt-1">
                        <span className="text-xs bg-blue-500 px-2 py-1 rounded-full">
                          {getActionText(selectedAction)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        
        {/* 빈 슬롯들 (9개가 안 되는 경우) */}
        {Array.from({ length: Math.max(0, 9 - photos.length) }, (_, index) => (
          <div 
            key={`empty-${index}`}
            className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center"
          >
            <ImageIcon className="w-8 h-8 text-gray-300" />
          </div>
        ))}
      </div>
    </div>
  );
}