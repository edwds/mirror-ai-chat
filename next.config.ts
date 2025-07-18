/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Sharp 최적화
    serverComponentsExternalPackages: ['sharp'],
  },
  // 이미지 최적화 설정
  images: {
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
  },
};

module.exports = nextConfig; 
