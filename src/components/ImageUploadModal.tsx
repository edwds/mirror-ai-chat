"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Upload, Clock, Image as ImageIcon } from "lucide-react";
import { PhotoHistory } from "@/components/PhotoHistory";

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

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: File) => void;
  onPhotoSelect: (photo: Photo) => void;
  selectedAction?: string | null;
}

export function ImageUploadModal({ 
  isOpen, 
  onClose, 
  onFileSelect, 
  onPhotoSelect,
  selectedAction 
}: ImageUploadModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('history');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      onClose();
    }
    // 파일 인풋 초기화
    if (e.target) e.target.value = "";
  };

  const handlePhotoSelect = (photo: Photo) => {
    onPhotoSelect(photo);
    onClose();
  };

  const getActionText = (action?: string | null) => {
    const actionMap: Record<string, string> = {
      'photo-review': '사진 평가',
      'reference-analysis': '레퍼런스 분석',
      'color-analysis': '색감 추출'
    };
    return action ? actionMap[action] || '분석' : '분석';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* 배경 오버레이 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* 모달 컨텐츠 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md mx-4"
        >
          <Card className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  사진 선택
                </h2>
                {selectedAction && (
                  <p className="text-sm text-gray-500 mt-1">
                    {getActionText(selectedAction)}을 위한 사진을 선택하세요
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* 탭 네비게이션 */}
            <div className="flex bg-gray-50 border-b">
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  최근 사진
                </div>
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'upload'
                    ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" />
                  새로 업로드
                </div>
              </button>
            </div>

            {/* 탭 컨텐츠 */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {activeTab === 'history' ? (
                <PhotoHistory 
                  onPhotoSelect={handlePhotoSelect}
                  selectedAction={selectedAction}
                />
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-gray-400 transition-colors">
                      <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-600 mb-4">
                        새로운 사진을 업로드하세요
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload-modal"
                      />
                      <label htmlFor="file-upload-modal">
                        <Button asChild className="cursor-pointer">
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            파일 선택
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}