/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // API 라우트 설정
  experimental: {
    // 이미지 업로드를 위한 body parser 크기 제한 증가
    serverComponentsExternalPackages: ['sharp'],
  },
  
  // 서버리스 함수 설정
  serverRuntimeConfig: {
    // API 타임아웃 설정 (30초)
    maxDuration: 30,
  },
  
  // 이미지 최적화 설정
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

module.exports = nextConfig; 
