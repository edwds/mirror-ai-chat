/**
 * 이미지를 압축하고 리사이즈하는 유틸리티 함수
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

export function compressImage(
  file: File, 
  options: CompressOptions = {}
): Promise<File> {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 2048,
      maxHeight = 2048,
      quality = 0.8,
      maxSizeKB = 4000 // 4MB
    } = options;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // 원본 크기 계산
      let { width, height } = img;

      // 비율 유지하면서 최대 크기에 맞춤
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      // 캔버스 크기 설정
      canvas.width = width;
      canvas.height = height;

      // 이미지 그리기
      ctx?.drawImage(img, 0, 0, width, height);

      // 압축된 이미지로 변환
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('이미지 압축 실패'));
            return;
          }

          // 파일 크기 확인
          const sizeKB = blob.size / 1024;
          
          if (sizeKB > maxSizeKB) {
            // 품질을 더 낮춰서 재시도
            const newQuality = Math.max(0.1, quality - 0.2);
            if (newQuality < quality) {
              compressImage(file, { ...options, quality: newQuality })
                .then(resolve)
                .catch(reject);
              return;
            }
          }

          // 새 파일 객체 생성
          const compressedFile = new File(
            [blob], 
            file.name.replace(/\.[^/.]+$/, '.jpg'), // 확장자를 jpg로 변경
            { 
              type: 'image/jpeg',
              lastModified: Date.now()
            }
          );

          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = URL.createObjectURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 