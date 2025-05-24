import React from "react";
import type { CameraInfo } from "@/types/camera";

interface CameraCardProps {
  camera: CameraInfo;
}

export default function CameraCard({ camera }: CameraCardProps) {
  if (!camera) return null;
  return (
    <div className="rounded-xl shadow-lg border p-6 bg-white max-w-xl">
      {/* 카메라 이름 */}
      <div className="text-xl font-bold mb-2">
        {camera.model_name} <span className="text-gray-500">({camera.manufacturer})</span>
      </div>
      {/* 주요 정보 */}
      <div className="mb-2 text-sm text-gray-700">
        {camera.key_features?.sensor?.type && (
          <span>{camera.key_features.sensor.type} 센서, </span>
        )}
        {camera.key_features?.sensor?.resolution_mp && (
          <span>{camera.key_features.sensor.resolution_mp}MP, </span>
        )}
        {camera.key_features?.lens?.type && (
          <span>{camera.key_features.lens.type} 렌즈, </span>
        )}
        {camera.camera_type && <span>{camera.camera_type}</span>}
      </div>
      {/* 장점 */}
      {camera.pros_cons?.pros?.length > 0 && (
        <div className="mb-2">
          <span className="font-semibold">장점:</span>
          <ul className="list-disc ml-5 text-green-700">
            {camera.pros_cons.pros.map((p: string, i: number) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}
      {/* 단점 */}
      {camera.pros_cons?.cons?.length > 0 && (
        <div className="mb-2">
          <span className="font-semibold">단점:</span>
          <ul className="list-disc ml-5 text-red-700">
            {camera.pros_cons.cons.map((c: string, i: number) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      {/* 가격 */}
      <div className="mt-2 text-sm">
        <span className="font-semibold">현재가격(신품): </span>
        {camera.price?.current_price_usd?.new ? `$${camera.price.current_price_usd.new}` : '정보 없음'}
      </div>
      <div className="text-sm">
        <span className="font-semibold">현재가격(중고): </span>
        {camera.price?.current_price_usd?.used?.min && camera.price?.current_price_usd?.used?.max
          ? `$${camera.price.current_price_usd.used.min} ~ $${camera.price.current_price_usd.used.max}`
          : '정보 없음'}
      </div>
    </div>
  );
} 