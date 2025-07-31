import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowDown, Link2, Camera, Eye, Palette, Target, Lightbulb, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { MessageContent } from "@/components/MessageContent";
import CameraCard from "@/components/CameraCard";
import { ImageUploadPreview } from "@/components/ImageUploadPreview";
import React, { useState, useEffect } from "react";

import type { Message } from "@/types/message";
import { AIProfile } from '@/components/AIProfile';
import { getCurrentPersona } from '@/lib/personas';

// AI 메시지 타입인지 확인하는 함수
function isAIMessage(role: string): boolean {
  return ['assistant', 'camera-info', 'photo-review-summary', 'photo-review-details', 'color-analysis'].includes(role);
}

// AI 프로필을 표시해야 하는지 판단하는 함수
function shouldShowAIProfile(messages: Message[], currentIndex: number): boolean {
  const currentMessage = messages[currentIndex];
  
  // 현재 메시지가 AI 메시지가 아니면 프로필 표시 안함
  if (!isAIMessage(currentMessage.role)) {
    return false;
  }
  
  // 첫 번째 메시지이거나 이전 메시지가 사용자 메시지면 프로필 표시
  if (currentIndex === 0) {
    return true;
  }
  
  const previousMessage = messages[currentIndex - 1];
  return !isAIMessage(previousMessage.role);
}

// EXIF 데이터에서 추정 표현을 필터링하는 함수
function filterExifValue(value: any): string | null {
  if (!value || value === null || value === undefined || value === '') return null;
  
  const stringValue = String(value).trim();
  
  // 추정 표현들을 필터링
  const estimatedPatterns = [
    /unknown/i,
    /likely/i,
    /estimated/i,
    /probably/i,
    /approximately/i,
    /^-+$/,
    /^n\/a$/i,
    /^none$/i
  ];
  
  for (const pattern of estimatedPatterns) {
    if (pattern.test(stringValue)) {
      return null;
    }
  }
  
  return stringValue;
}

// 사진 평가 요약 컴포넌트 (썸네일 + 별점 + 한줄평 + EXIF + 강점 + 개선점 + 개선방향)
function PhotoReviewSummaryCard({ review, imageUrl }: { review: any; imageUrl: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg h-full"
    >
      <div className="bg-white rounded-3xl border border-gray-200 p-4 h-full flex flex-col">
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="w-full md:w-44 flex justify-start">
            <div className="relative">
              <img
                src={imageUrl}
                alt="Reviewed photo"
                className="w-44 h-44 object-cover rounded-2xl"
              />
              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded-2xl px-3 py-2">
                <div className="flex flex-col items-center gap-1">
                  <div className="text-white text-xl font-bold">
                    {Math.round((review.summary?.score || 0) * 20)}
                  </div>
                  <div className="flex justify-center w-full">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.floor(review.summary?.score || 0)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xl font-bold text-gray-700 mb-3 mt-2">{review.summary?.comment}</p>
            
            {/* EXIF */}
            {(() => {
              if (!review.summary?.exif) return null;
              
              const camera = filterExifValue(review.summary.exif.camera);
              const lens = filterExifValue(review.summary.exif.lens);
              const aperture = filterExifValue(review.summary.exif.aperture);
              const shutter = filterExifValue(review.summary.exif.shutter);
              const iso = filterExifValue(review.summary.exif.iso);
              
              // 유효한 정보가 하나도 없으면 EXIF 블록 자체를 표시하지 않음
              if (!camera && !lens && !aperture && !shutter && !iso) {
                return null;
              }
              
              const shootingInfo = [
                aperture,
                shutter,
                iso ? `ISO ${iso}` : null
              ].filter(item => item !== null);
              
              return (
                <div className="p-3 bg-gray-50 rounded">
                  <div className="text-sm text-left space-y-1">
                    {/* 카메라 */}
                    {camera && (
                      <div className="text-gray-900 font-medium">
                        {camera}
                      </div>
                    )}
                    {/* 렌즈 */}
                    {lens && (
                      <div className="text-gray-900 font-medium">
                        {lens}
                      </div>
                    )}
                    {/* 촬영정보 */}
                    {shootingInfo.length > 0 && (
                      <div className="text-gray-700">
                        {shootingInfo.join(' · ')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* 피드백 */}
        {review.feedback && (
          <div className="space-y-3 flex-1">
            <div className="grid grid-cols-2 gap-3">
              {/* 강점 */}
              <div className="p-3 border border-gray-200 rounded-2xl">
                <h4 className="text-base font-medium text-gray-900 mb-3">강점</h4>
                <ul className="space-y-2">
                  {review.feedback.strengths?.map((strength: string, idx: number) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 개선점 */}
              <div className="p-3 border border-gray-200 rounded-2xl">
                <h4 className="text-base font-medium text-gray-900 mb-3">개선점</h4>
                <ul className="space-y-2">
                  {review.feedback.weaknesses?.map((weakness: string, idx: number) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-gray-400 mt-0.5">•</span>
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 개선 방향 */}
            {review.feedback?.direction && (
              <div className="p-3 bg-gray-50 rounded-2xl">
                <h4 className="text-base font-medium text-gray-900 mb-3">개선 방향</h4>
                <p className="text-sm text-gray-700 leading-relaxed">{review.feedback.direction}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// 상세 평가 컴포넌트 (세부 점수만)
function PhotoReviewDetailsCard({ review }: { review: any }) {
  const iconMap: Record<string, React.ReactElement> = {
    composition: <Target className="w-4 h-4 text-white" />,
    lighting: <Lightbulb className="w-4 h-4 text-white" />,
    color: <Palette className="w-4 h-4 text-white" />,
    focus: <Eye className="w-4 h-4 text-white" />,
    creativity: <Star className="w-4 h-4 text-white" />
  };

  const categoryNames: Record<string, string> = {
    composition: "구도",
    lighting: "조명",
    color: "색감",
    focus: "초점",
    creativity: "창의성"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full max-w-lg h-full"
    >
      <div className="bg-white rounded-3xl border border-gray-200 p-5 h-full flex flex-col">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">상세 평가</h4>
        <div className="space-y-4 flex-1">
          {Object.entries(review.detailed_scores || {}).map(([key, score]: [string, any]) => (
            <div key={key} className="bg-gray-50 rounded-xl p-3">
              {/* 헤더: 아이콘 + 카테고리 + 점수 */}
              <div className="flex items-center gap-3 mb-2">
                <div className="w-7 h-7 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  {iconMap[key]}
                </div>
                <span className="text-sm font-medium text-gray-900 flex-1">{categoryNames[key] || key}</span>
                <span className="text-base font-bold text-gray-900">{Math.round(score * 20)}점</span>
              </div>
              
              {/* 설명 */}
              {review.detailed_comments?.[key] && (
                <p className="text-sm text-gray-600">{review.detailed_comments[key]}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// 색감 분석 개별 카드 컴포넌트들
function ColorSummaryCard({ analysis, imageUrl }: { analysis: any; imageUrl: string }) {
  const downloadXMP = async () => {
    try {
      const response = await fetch('/api/photography/xmp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis, imageUrl }),
      });
      
      if (!response.ok) throw new Error('XMP 생성 실패');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `color-preset-${Date.now()}.xmp`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('XMP 다운로드 오류:', error);
      alert('XMP 파일 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-96 h-full flex-shrink-0"
    >
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full flex flex-col">
        <div className="space-y-5">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-bold text-gray-900">색감 분석</h4>
          </div>
          
          {/* 썸네일 + 기본 정보 */}
          <div className="flex gap-4">
            <div className="w-32 flex-shrink-0">
              <img
                src={imageUrl}
                alt="분석된 이미지"
                className="w-32 h-32 object-cover rounded-xl shadow-md"
              />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-lg font-semibold text-gray-800 leading-tight">{analysis.summary?.style}</p>
                <p className="text-sm text-gray-500 mt-1">{analysis.summary?.mood}</p>
              </div>
            </div>
          </div>

          {/* 색상팔레트 */}
          {analysis.analysis?.color_palette && (
            <div className="space-y-3">
              <h5 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">사진 대표 색상</h5>
              <div className="flex gap-3 flex-wrap">
                {analysis.analysis.color_palette.map((color: string, idx: number) => (
                  <div key={idx} className="flex flex-col items-center group">
                    <div 
                      className="w-12 h-12 rounded-lg shadow-md border border-gray-300 group-hover:scale-105 transition-transform cursor-pointer"
                      style={{ backgroundColor: color }}
                      title={`색상: ${color}`}
                      onClick={() => navigator.clipboard.writeText(color)}
                    />
                    <span className="text-xs text-gray-600 mt-1.5 font-mono font-semibold">{color.toUpperCase()}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 italic">색상을 클릭하면 HEX 코드가 복사됩니다</p>
            </div>
          )}

          {/* 핵심 조정사항 */}
          {analysis.analysis?.key_adjustments && (
            <div className="space-y-3">
              <h5 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">핵심 조정사항</h5>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
                <ul className="space-y-2">
                  {analysis.analysis.key_adjustments.map((adjustment: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-blue-900">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="leading-relaxed">{adjustment}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* XMP 다운로드 버튼 */}
          <div className="pt-2">
            <button
              onClick={downloadXMP}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl py-3.5 px-4 font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <span className="text-lg">📁</span>
              <span>라이트룸 프리셋 다운로드</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ColorBasicCard({ analysis }: { analysis: any }) {
  // 슬라이더 범위 설정 (라이트룸 기준)
  const sliderRanges: Record<string, { min: number; max: number }> = {
    temperature: { min: 2000, max: 9000 },
    tint: { min: -150, max: 150 },
    exposure: { min: -5, max: 5 },
    highlights: { min: -100, max: 100 },
    shadows: { min: -100, max: 100 },
    whites: { min: -100, max: 100 },
    blacks: { min: -100, max: 100 },
    texture: { min: -100, max: 100 },
    clarity: { min: -100, max: 100 },
    vibrance: { min: -100, max: 100 },
    saturation: { min: -100, max: 100 }
  };

  const getSliderPosition = (key: string, value: number) => {
    const range = sliderRanges[key];
    if (!range) return 50; // 기본값
    
    const percentage = ((value - range.min) / (range.max - range.min)) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  const getSliderGradient = (key: string) => {
    switch (key) {
      case 'temperature':
        return 'from-blue-400 to-orange-400';
      case 'tint':
        return 'from-green-400 to-pink-400';
      default:
        return 'from-gray-600 to-gray-100';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-96 h-full flex-shrink-0"
    >
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full flex flex-col">
        <div className="space-y-5">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xl font-bold text-gray-900">기본 조정</h4>
              <p className="text-sm text-gray-500 mt-1">Basic Panel</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {Object.entries(analysis.lightroom_settings?.basic || {}).map(([key, value]: [string, any]) => {
              const position = getSliderPosition(key, value);
              const gradient = getSliderGradient(key);
              return (
                <div key={key} className="space-y-2">
                  {/* 라벨과 값 */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 capitalize text-sm font-semibold">{key}</span>
                    <span className="text-gray-900 text-sm font-mono bg-gray-50 px-2 py-1 rounded-md">
                      {value > 0 ? `+${value}` : value}
                    </span>
                  </div>
                  
                  {/* 슬라이더 바 */}
                  <div className="relative h-2.5 bg-gray-100 rounded-full shadow-inner">
                    {/* 슬라이더 트랙 */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-full opacity-50`}></div>
                    
                    {/* 중앙선 */}
                    <div className="absolute left-1/2 top-0 w-0.5 h-full bg-gray-400 transform -translate-x-0.5 rounded-full"></div>
                    
                    {/* 슬라이더 핸들 */}
                    <div 
                      className="absolute top-1/2 w-4 h-4 bg-white rounded-full border-2 border-gray-700 transform -translate-y-1/2 -translate-x-1/2 shadow-lg hover:scale-110 transition-transform"
                      style={{ left: `${position}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ColorHSLCard({ analysis }: { analysis: any }) {
  const [activeTab, setActiveTab] = useState<'hue' | 'saturation' | 'luminance'>('hue');
  
  const getSliderPosition = (value: number) => {
    // HSL 값은 -100 ~ +100 범위
    const percentage = ((value + 100) / 200) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  const colors = ['red', 'orange', 'yellow', 'green', 'aqua', 'blue', 'purple', 'magenta'];
  const colorNames: Record<string, string> = {
    red: 'Red',
    orange: 'Orange', 
    yellow: 'Yellow',
    green: 'Green',
    aqua: 'Aqua',
    blue: 'Blue',
    purple: 'Purple',
    magenta: 'Magenta'
  };

  const colorGradients: Record<string, Record<string, string>> = {
    red: {
      hue: 'from-purple-500 via-red-500 to-orange-500',
      saturation: 'from-gray-300 to-red-500',
      luminance: 'from-red-900 via-red-500 to-red-100'
    },
    orange: {
      hue: 'from-red-500 via-orange-500 to-yellow-500',
      saturation: 'from-gray-300 to-orange-500',
      luminance: 'from-orange-900 via-orange-500 to-orange-100'
    },
    yellow: {
      hue: 'from-orange-500 via-yellow-500 to-green-500',
      saturation: 'from-gray-300 to-yellow-500',
      luminance: 'from-yellow-900 via-yellow-500 to-yellow-100'
    },
    green: {
      hue: 'from-yellow-500 via-green-500 to-cyan-500',
      saturation: 'from-gray-300 to-green-500',
      luminance: 'from-green-900 via-green-500 to-green-100'
    },
    aqua: {
      hue: 'from-green-500 via-cyan-500 to-blue-500',
      saturation: 'from-gray-300 to-cyan-500',
      luminance: 'from-cyan-900 via-cyan-500 to-cyan-100'
    },
    blue: {
      hue: 'from-cyan-500 via-blue-500 to-purple-500',
      saturation: 'from-gray-300 to-blue-500',
      luminance: 'from-blue-900 via-blue-500 to-blue-100'
    },
    purple: {
      hue: 'from-blue-500 via-purple-500 to-pink-500',
      saturation: 'from-gray-300 to-purple-500',
      luminance: 'from-purple-900 via-purple-500 to-purple-100'
    },
    magenta: {
      hue: 'from-purple-500 via-pink-500 to-red-500',
      saturation: 'from-gray-300 to-pink-500',
      luminance: 'from-pink-900 via-pink-500 to-pink-100'
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-[420px] h-full flex-shrink-0"
    >
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full flex flex-col">
        <div className="space-y-5 h-full">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-bold text-gray-900">HSL</h4>
          </div>
          
          {/* 탭 헤더 */}
          <div className="flex bg-gray-100/50 rounded-lg p-0.5">
            {(['hue', 'saturation', 'luminance'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all duration-150 ${
                  activeTab === tab
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/30'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* 탭 콘텐츠 */}
          <div className="space-y-4 flex-1">
            {colors.map((color) => {
              const values = analysis.lightroom_settings?.hsl?.[color];
              if (!values) return null;
              
              const currentValue = values[activeTab];
              const gradient = colorGradients[color]?.[activeTab] || 'from-gray-400 to-gray-600';
              
              return (
                <div key={color} className="space-y-2">
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-gray-700 text-sm font-semibold flex-shrink-0">{colorNames[color]}</span>
                    <span className="text-gray-900 font-mono text-xs bg-gray-50 px-2 py-1 rounded-md flex-shrink-0 min-w-[3rem] text-center">
                      {currentValue > 0 ? `+${currentValue}` : currentValue}
                    </span>
                  </div>
                  <div className="relative h-2.5 bg-gray-100 rounded-full shadow-inner">
                    <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-full opacity-80`}></div>
                    <div className="absolute left-1/2 top-0 w-0.5 h-full bg-gray-500 transform -translate-x-0.5 rounded-full"></div>
                    <div 
                      className="absolute top-1/2 w-4 h-4 bg-white rounded-full border-2 border-gray-700 transform -translate-y-1/2 -translate-x-1/2 shadow-lg hover:scale-110 transition-transform"
                      style={{ left: `${getSliderPosition(currentValue)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ColorAdvancedCard({ analysis }: { analysis: any }) {
  const getSliderPosition = (value: number) => {
    // 톤커브 값은 -100 ~ +100 범위
    const percentage = ((value + 100) / 200) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  const getColorWheelPosition = (hue: number, saturation: number) => {
    // 색상환에서의 위치 계산 (더 정확한 좌표)
    const angle = (hue * Math.PI) / 180;
    const radius = Math.min(saturation / 100, 1) * 32; // 최대 반지름 32px (80px 휠의 40% 정도)
    const centerX = 40; // 80px 휠의 중심
    const centerY = 40;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY - radius * Math.sin(angle); // Y축 반전 (CSS 좌표계)
    return { x: Math.max(4, Math.min(76, x)), y: Math.max(4, Math.min(76, y)) };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-96 h-full flex-shrink-0"
    >
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-full flex flex-col">
        <div className="space-y-5">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xl font-bold text-gray-900">색상 그레이딩</h4>
              <p className="text-sm text-gray-500 mt-1">Color Grading</p>
            </div>
          </div>

          {/* 색상 그레이딩 - 3개 병렬 배열 */}
          {analysis.lightroom_settings?.color_grading && (
            <div className="space-y-4">
              {/* 컬러휠 3개 병렬 배치 */}
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(analysis.lightroom_settings.color_grading).map(([area, values]: [string, any]) => {
                  const position = getColorWheelPosition(values.hue, values.saturation);
                  return (
                    <div key={area} className="flex flex-col items-center">
                      {/* 라벨 */}
                      <div className="text-xs font-semibold text-gray-600 mb-3 capitalize tracking-wide uppercase">{area}</div>
                      
                      {/* 컬러 휠 */}
                      <div className="relative w-20 h-20 flex-shrink-0 group">
                        <div 
                          className="w-full h-full rounded-full"
                          style={{
                            background: `conic-gradient(
                              hsl(0, 100%, 50%),
                              hsl(60, 100%, 50%),
                              hsl(120, 100%, 50%),
                              hsl(180, 100%, 50%),
                              hsl(240, 100%, 50%),
                              hsl(300, 100%, 50%),
                              hsl(360, 100%, 50%)
                            )`
                          }}
                        />
                        
                        {/* 선택된 지점 */}
                        <div 
                          className="absolute w-3 h-3 bg-white rounded-full border-2 border-gray-800 transform -translate-x-1/2 -translate-y-1/2 shadow-lg group-hover:scale-110 transition-transform"
                          style={{ 
                            left: `${position.x}px`, 
                            top: `${position.y}px` 
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 톤커브 */}
          {analysis.lightroom_settings?.tone_curve && (
            <div className="space-y-4">
              <h5 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Tone Curve</h5>
              <div className="space-y-3">
                {Object.entries(analysis.lightroom_settings.tone_curve).map(([key, value]: [string, any]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 capitalize text-sm font-semibold">{key}</span>
                      <span className="font-mono text-gray-900 text-sm bg-gray-50 px-2 py-1 rounded-md">
                        {value > 0 ? `+${value}` : value}
                      </span>
                    </div>
                    <div className="relative h-2.5 bg-gray-100 rounded-full shadow-inner">
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-600 via-gray-300 to-gray-100 rounded-full opacity-40"></div>
                      <div className="absolute left-1/2 top-0 w-0.5 h-full bg-gray-400 transform -translate-x-0.5 rounded-full"></div>
                      <div 
                        className="absolute top-1/2 w-4 h-4 bg-white rounded-full border-2 border-gray-700 transform -translate-y-1/2 -translate-x-1/2 shadow-lg hover:scale-110 transition-transform"
                        style={{ left: `${getSliderPosition(value)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// 어시스턴트 메시지 버블 분리
function AssistantMessageBubble({ content, onAnimationComplete }: { content: string; onAnimationComplete?: () => void }) {
  const paragraphs = content.split(/\n{2,}/);
  const [visibleParagraphs, setVisibleParagraphs] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    // 이미 애니메이션이 실행되었으면 다시 실행하지 않음
    if (hasAnimated) {
      setVisibleParagraphs(paragraphs.length); // 모든 문단 즉시 표시
      return;
    }

    setVisibleParagraphs(0);
    if (paragraphs.length === 0) {
      // 빈 내용인 경우 즉시 콜백 호출
      setHasAnimated(true);
      if (onAnimationComplete) {
        setTimeout(() => onAnimationComplete(), 100);
      }
      return;
    }
    let current = 0;
    let timer: NodeJS.Timeout | null = null;

    const showNext = () => {
      setVisibleParagraphs(v => v + 1);
      current++;
      if (current < paragraphs.length) {
        timer = setTimeout(showNext, 1000); // 문단 사이 텀 1초
      } else {
        // 모든 문단 표시 완료 시 콜백 호출
        setHasAnimated(true);
        if (onAnimationComplete) {
          setTimeout(() => onAnimationComplete(), 500); // 마지막 문단 안정화 후 500ms 대기
        }
      }
    };
    timer = setTimeout(showNext, 200); // 첫 문단도 살짝 delay

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [content, paragraphs.length, hasAnimated, onAnimationComplete]);

  useEffect(() => {
    const el = document.querySelector('.flex-1.overflow-y-auto.w-full');
    if (el) {
      setTimeout(() => {
        el.scrollTop = el.scrollHeight;
      }, 0);
    }
  }, [visibleParagraphs]);

  return (
    <div className="flex flex-col items-start gap-4 w-full">
      {paragraphs.map((para, i) =>
        i < visibleParagraphs ? (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              damping: 18,
              stiffness: 120,
              duration: 0.9,
            }}
            className="w-full"
          >
            <Card
              className={`p-4 mb-1 shadow-none border-0 bg-white text-black mr-auto rounded-3xl rounded-tl-md max-w-[80%] min-w-[120px] w-fit inline-block break-words`}
              style={{ width: para.length < 40 ? 'fit-content' : undefined }}
            >
              {para.trim()}
            </Card>
          </motion.div>
        ) : null
      )}
    </div>
  );
}

function renderUserMessageWithLinkIcon(content: string) {
  // URL + 텍스트 조합 감지
  const urlAndText = content.trim().match(/^(https?:\/\/[^\s]+)\s+(.+)$/);
  if (urlAndText) {
    const url = urlAndText[1];
    const text = urlAndText[2];
    return (
      <span>
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-white underline mr-1">
        <Link2 className="w-4 h-4 inline-block align-middle relative -top-[-2px]" />
        </a>
        {text}
      </span>
    );
  }
  // 일반 텍스트는 그대로
  return <span>{content}</span>;
}

export function ChatMessageList({
  messages,
  isLoading,
  handleActionClick,
  setMessages,
  setSuggestedQuestions
}: {
  messages: Message[];
  isLoading: boolean;
  handleActionClick: (action: string, url: string, idx: number, exif?: any) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setSuggestedQuestions: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {messages.map((msg, idx) => {
        if (msg.role === "image-upload") {
          return (
            <div key={idx} className="flex mb-4 justify-end">
              <div className="flex justify-end w-full">
                <ImageUploadPreview
                  file={msg.file}
                  onUploadComplete={(url: string, exif?: any) => {
                    setMessages(msgs => {
                      const newMsgs = [...msgs];
                      const currentMsg = newMsgs[idx];
                      
                      // selectedAction이 있으면 바로 selected 상태로 설정하여 선택지 스킵
                      if (currentMsg.role === "image-upload" && currentMsg.selectedAction) {
                        const actionMap: Record<string, string> = {
                          'photo-review': '사진 평가',
                          'reference-analysis': '레퍼런스 분석', 
                          'color-analysis': '색감 추출'
                        };
                        const selectedKey = actionMap[currentMsg.selectedAction];
                        
                        newMsgs[idx] = { 
                          role: "image-options", 
                          url, 
                          exif,
                          selected: selectedKey,
                          selectedAction: currentMsg.selectedAction
                        };
                        
                        // 바로 해당 액션 실행
                        setTimeout(() => {
                          handleActionClick(selectedKey, url, idx, exif);
                        }, 100);
                      } else {
                        // 일반적인 경우 - 선택지 표시
                        newMsgs[idx] = { 
                          role: "image-options", 
                          url, 
                          exif,
                          selectedAction: currentMsg.role === "image-upload" ? currentMsg.selectedAction : undefined
                        };
                      }
                      
                      return newMsgs;
                    });
                  }}
                  onUploadError={(error: string) => {
                    setMessages(msgs => {
                      const newMsgs = [...msgs];
                      newMsgs[idx] = { role: "user", content: `[업로드 실패: ${error}]` };
                      return newMsgs;
                    });
                  }}
                />
              </div>
            </div>
          );
        } else if (msg.role === "camera-info") {
          const showProfile = shouldShowAIProfile(messages, idx);
          return (
            <div key={idx} className="flex mb-4 justify-start">
              <div className="flex flex-col w-full">
                {showProfile && <AIProfile persona={getCurrentPersona(msg.role)} />}
                <div className="flex items-end gap-2 w-full">
                  <CameraCard camera={msg.content} />
                </div>
              </div>
            </div>
          );
        } else if (msg.role === "assistant") {
          const showProfile = shouldShowAIProfile(messages, idx);
          const handleAnimationComplete = () => {
            if (msg.suggestedQuestions && msg.suggestedQuestions.length > 0) {
              setSuggestedQuestions(msg.suggestedQuestions);
            }
          };
          
          return (
            <div key={idx} className="flex mb-4 justify-start">
              <div className="flex flex-col w-full">
                {showProfile && <AIProfile persona={getCurrentPersona(msg.role)} />}
                <AssistantMessageBubble 
                  content={msg.content} 
                  onAnimationComplete={handleAnimationComplete}
                />
              </div>
            </div>
          );
        } else if (msg.role === "user") {
          // 이미지 단독 마크다운 메시지면 Card 없이 이미지만 렌더링
          if (/^!\[.*\]\(.*\)$/.test(msg.content.trim())) {
            const match = msg.content.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
            const alt = match?.[1] || '';
            const src = match?.[2] || '';
            return (
              <div key={idx} className="flex mb-4 justify-end">
                <img
                  src={src}
                  alt={alt}
                  className="w-full max-w-xs h-auto max-h-80 object-cover rounded-2xl shadow-lg mx-auto"
                  style={{ background: "none" }}
                />
              </div>
            );
          } else {
            // URL + 텍스트 조합이면 URL을 링크 아이콘으로 치환
            return (
              <div key={idx} className="flex mb-4 justify-end">
                <div className="flex items-end gap-2 w-full">
                  <Card className="p-4 max-w-[85%] relative shadow-none border-0 bg-gradient-to-r from-[#7B47F0] via-[#6055F0] to-[#4762F0] text-white ml-auto rounded-3xl rounded-tr-md">
                    {renderUserMessageWithLinkIcon(msg.content)}
                  </Card>
                </div>
              </div>
            );
          }
        } else if (msg.role === "image-options") {
          const actions = [
            { key: "사진 평가", icon: "🎯", display: "🎯 사진 평가" },
            { key: "레퍼런스 분석", icon: "🔍", display: "🔍 레퍼런스 분석" },
            { key: "색감 추출", icon: "🎨", display: "🎨 색감 추출" }
          ];

          return (
            <div key={idx} className="flex flex-col mb-4 items-start space-y-4">
              
              {/* 1. 업로드된 이미지 - 즉시 표시 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="flex justify-end w-full"
              >
                <div className="w-full max-w-sm">
                  <img
                    src={msg.url}
                    alt="Uploaded"
                    className="w-full h-auto max-h-80 object-cover rounded-lg shadow-lg"
                  />
                </div>
              </motion.div>
              
              {/* 2. AI 대화형 메시지 - selectedAction이 없고 선택되지 않은 경우만 표시 */}
              {!msg.selected && !msg.selectedAction && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="flex justify-start w-full"
                >
                  <div className="flex flex-col w-full">
                    <AIProfile persona={getCurrentPersona('assistant')} />
                    <Card className="p-4 mb-3 shadow-none border-0 bg-white text-black rounded-3xl rounded-tl-md max-w-[80%] w-fit">
                      어떤 분석을 도와드릴까요? 🤔
                    </Card>
                  </div>
                </motion.div>
              )}
              
              {/* 3. 옵션 버튼들 또는 선택된 버튼 - selectedAction이 없는 경우만 표시 */}
              {!msg.selectedAction && (
                <div className="flex flex-col gap-2 w-full">
                  {!msg.selected ? (
                    actions.map((action, actionIdx) => (
                      <motion.div
                        key={action.key}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 1.0 + (actionIdx * 0.1) }}
                        className="flex justify-end"
                      >
                        <button
                          onClick={() => handleActionClick(action.key, msg.url, idx, msg.exif)}
                          className="px-4 py-3 bg-white text-gray-700 rounded-3xl rounded-tr-md max-w-[80%] w-fit shadow-sm"
                        >
                          {action.display}
                        </button>
                      </motion.div>
                    ))
                  ) : (
                    // 선택된 버튼 표시
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="flex justify-end"
                    >
                      <Card className="p-4 shadow-none border-0 bg-gradient-to-r from-[#7B47F0] via-[#6055F0] to-[#4762F0] text-white rounded-3xl rounded-tr-md max-w-[80%] w-fit">
                        {actions.find(a => a.key === msg.selected)?.display || msg.selected}
                      </Card>
                    </motion.div>
                  )}
                </div>
              )}

              {/* 4. selectedAction이 있는 경우 - 선택된 버튼만 표시 */}
              {msg.selectedAction && msg.selected && (
                <div className="flex flex-col gap-2 w-full">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex justify-end"
                  >
                    <Card className="p-4 shadow-none border-0 bg-gradient-to-r from-[#7B47F0] via-[#6055F0] to-[#4762F0] text-white rounded-3xl rounded-tr-md max-w-[80%] w-fit">
                      {actions.find(a => a.key === msg.selected)?.display || msg.selected}
                    </Card>
                  </motion.div>
                </div>
              )}
              </div>
            </div>
          );
        } else if (msg.role === "photo-review-summary") {
          // 다음 메시지가 photo-review-details인지 확인
          const nextMsg = messages[idx + 1];
          const hasDetailsCard = nextMsg && nextMsg.role === "photo-review-details";
          const showProfile = shouldShowAIProfile(messages, idx);
          
          return (
            <div key={idx} className="flex mb-4 justify-start w-full">
              <div className="flex flex-col w-full">
                {showProfile && <AIProfile persona={getCurrentPersona(msg.role)} />}
                <div 
                  className="flex gap-4 overflow-x-auto w-full max-w-5xl pb-2 scroll-smooth"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#D1D5DB #F3F4F6',
                    scrollBehavior: 'smooth'
                  }}
                >
                {/* 사진 평가 요약 카드 */}
                <div className="flex-shrink-0 h-full">
                  <div className="h-full">
                    <PhotoReviewSummaryCard review={msg.content} imageUrl={msg.imageUrl} />
                  </div>
                </div>
                
                {/* 상세 평가 카드 (있는 경우) */}
                {hasDetailsCard && (
                  <div className="flex-shrink-0 h-full">
                    <div className="h-full">
                      <PhotoReviewDetailsCard review={nextMsg.content} />
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          );
        } else if (msg.role === "photo-review-details") {
          // 이전 메시지가 photo-review-summary가 아닌 경우에만 렌더링
          const prevMsg = messages[idx - 1];
          const isStandalone = !prevMsg || prevMsg.role !== "photo-review-summary";
          
          if (isStandalone) {
            const showProfile = shouldShowAIProfile(messages, idx);
            return (
              <div key={idx} className="flex mb-4 justify-start">
                <div className="flex flex-col w-full">
                  {showProfile && <AIProfile persona={getCurrentPersona(msg.role)} />}
                  <PhotoReviewDetailsCard review={msg.content} />
                </div>
              </div>
            );
          }
          
          // photo-review-summary와 함께 렌더링되는 경우 null 반환
          return null;
        } else if (msg.role === "color-analysis") {
          const showProfile = shouldShowAIProfile(messages, idx);
          return (
            <div key={idx} className="flex mb-4 justify-start w-full">
              <div className="flex flex-col w-full">
                {showProfile && <AIProfile persona={getCurrentPersona(msg.role)} />}
                <div 
                  className="flex gap-4 overflow-x-auto w-full max-w-5xl pb-2 scroll-smooth"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#D1D5DB #F3F4F6',
                    scrollBehavior: 'smooth'
                  }}
                >
                {/* 1번 카드: 색감 분석 요약 */}
                <div className="flex-shrink-0 h-full">
                  <div className="h-full">
                    <ColorSummaryCard analysis={msg.content} imageUrl={msg.imageUrl} />
                  </div>
                </div>
                
                {/* 2번 카드: 기본 조정 */}
                <div className="flex-shrink-0 h-full">
                  <div className="h-full">
                    <ColorBasicCard analysis={msg.content} />
                  </div>
                </div>
                
                {/* 3번 카드: HSL 조정 */}
                <div className="flex-shrink-0 h-full">
                  <div className="h-full">
                    <ColorHSLCard analysis={msg.content} />
                  </div>
                </div>
                
                {/* 4번 카드: 톤커브 & 색상 그레이딩 */}
                <div className="flex-shrink-0 h-full">
                  <div className="h-full">
                    <ColorAdvancedCard analysis={msg.content} />
                  </div>
                </div>
                </div>
              </div>
            </div>
          );
        }

        return null;
      })}
      {isLoading && (
        <div className="flex mb-4 justify-start">
          <div className="flex items-end gap-2 w-full">
            <Card className="p-4 max-w-[85%] relative shadow-none border-0 bg-white text-black mr-auto rounded-3xl rounded-tl-md">
              <div className="flex gap-2 items-center">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-[bounce_1s_infinite_0ms]" />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-[bounce_1s_infinite_200ms]" />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-[bounce_1s_infinite_400ms]" />
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
} 