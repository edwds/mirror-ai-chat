# Mirror AI Chat - AI 사진 멘토링 플랫폼

Next.js 기반의 AI 사진 멘토링 채팅 애플리케이션입니다. 사진 업로드, 카메라 정보 조회, AI 기반 사진 분석 및 피드백을 제공합니다.

## 🚀 주요 기능

### 📸 AI 사진 분석
- **이미지 업로드**: 대용량 이미지 청크 업로드 (4.5MB 제한 우회)
- **EXIF 데이터 추출**: 촬영 정보 자동 분석
- **AI 사진 평가**: 구도, 노출, 색감 등 종합적 평가
- **색감 분석**: Lightroom 스타일 컬러 휠 및 슬라이더
- **XMP 프리셋**: 색보정 프리셋 다운로드

### 📷 카메라 정보 시스템
- **카메라 데이터베이스**: 주요 카메라 모델 정보 저장
- **LLM 기반 정보 생성**: 없는 모델은 AI가 실시간 생성
- **상세 스펙 표시**: 센서, 해상도, 장단점, 가격 정보

### 💬 인터랙티브 채팅
- **실시간 AI 멘토링**: OpenAI GPT-4.1-mini 기반
- **다양한 메시지 타입**: 텍스트, 이미지, 카메라 카드
- **제안 질문**: 초보자를 위한 가이드 질문
- **애니메이션**: Framer Motion 기반 부드러운 UI

### 👤 사용자 관리
- **Google OAuth**: 간편 로그인/로그아웃
- **프로필 관리**: 닉네임, 선호 장르, 사용 카메라 설정
- **개인화**: 사용자별 맞춤 피드백

## 🛠 기술 스택

### Frontend
- **Framework**: Next.js 15 (App Router, TypeScript)
- **UI Library**: React 19, Tailwind CSS 4
- **Components**: Radix UI, Lucide React Icons
- **Animation**: Framer Motion
- **Markdown**: React Markdown with syntax highlighting

### Backend
- **API**: Next.js API Routes
- **Database**: Vercel Postgres with Neon
- **Authentication**: NextAuth with Google OAuth
- **File Storage**: Vercel Blob
- **AI**: OpenAI API (GPT-4.1-mini)

### Image Processing
- **Processing**: Sharp (리사이징, 최적화)
- **EXIF**: exifr (메타데이터 추출)
- **Upload**: 청크 기반 대용량 파일 처리

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   │   ├── auth/          # NextAuth 인증
│   │   ├── camera/        # 카메라 정보 CRUD
│   │   ├── llm-camera/    # AI 카메라 정보 생성
│   │   ├── photography/   # 사진 업로드/분석
│   │   └── profile/       # 사용자 프로필
│   ├── chat/              # 메인 채팅 페이지
│   ├── profile/           # 프로필 설정 페이지
│   └── layout.tsx         # 루트 레이아웃
├── components/            # React 컴포넌트
│   ├── ui/               # shadcn/ui 기반 공통 컴포넌트
│   ├── AIProfile.tsx     # AI 페르소나 표시
│   ├── CameraCard.tsx    # 카메라 정보 카드
│   ├── ChatInputBox.tsx  # 채팅 입력창
│   ├── ChatMessageList.tsx # 메시지 렌더링
│   ├── ImageUpload.tsx   # 기본 이미지 업로드
│   ├── ImageUploadPreview.tsx # 고급 업로드 (청크)
│   └── LoginButton.tsx   # 인증 버튼
├── lib/                  # 유틸리티 라이브러리
│   ├── openai.ts        # OpenAI API 연동
│   ├── authOptions.ts   # NextAuth 설정
│   ├── fetchCameraInfo.ts # 카메라 정보 조회
│   └── utils.ts         # 공통 유틸리티
└── types/               # TypeScript 타입 정의
```

## 🔄 데이터 흐름

### 채팅 시스템
1. **사용자 입력** → 텍스트/이미지/명령어 분석
2. **API 라우팅** → `/api/photography` 또는 특수 명령어 처리
3. **AI 처리** → OpenAI GPT로 응답 생성
4. **실시간 렌더링** → 애니메이션과 함께 메시지 표시

### 이미지 업로드
1. **청크 분할** → 3MB 단위로 파일 분할
2. **병렬 업로드** → 진행률 추적과 함께 업로드
3. **서버 처리** → Blob 저장, EXIF 추출, DB 기록
4. **분석 옵션** → 업로드 완료 후 AI 분석 선택

### 카메라 정보
1. **DB 우선 조회** → 기존 데이터 확인
2. **LLM 생성** → 없는 경우 AI가 실시간 생성
3. **스키마 검증** → 구조화된 JSON 데이터
4. **DB 저장** → 향후 재사용을 위한 캐싱

## 🚀 시작하기

### 필수 요구사항
- Node.js 18.17 이상
- npm 또는 yarn
- Vercel Postgres 데이터베이스
- OpenAI API 키
- Google OAuth 앱

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 환경 변수 설정 (.env.local)
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
POSTGRES_URL=your-vercel-postgres-url
OPENAI_API_KEY=your-openai-api-key
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token

# 개발 서버 실행
npm run dev
```

### 데이터베이스 설정

```sql
-- src/lib/db/schema.sql 참조
-- 사용자, 카메라, 사진 테이블 생성
```

## 📱 주요 페이지

- **`/`**: 메인 페이지 (자동으로 `/chat`으로 리다이렉트)
- **`/chat`**: 메인 채팅 인터페이스
- **`/profile`**: 사용자 프로필 관리

## 🎯 특별한 기능

### 카메라 명령어
- `/카메라 [모델명]`: 특정 카메라 정보 조회
- 예: `/카메라 Canon EOS R5`

### 이미지 분석 옵션
- **사진 평가**: 구도, 노출, 색감 등 종합 점수
- **색감 추출**: 주요 색상 팔레트 및 조정 제안
- **EXIF 분석**: 촬영 설정 정보 표시

### UI/UX 특징
- **반응형 디자인**: 모바일/데스크톱 최적화
- **다크모드**: 시스템 설정 자동 감지
- **애니메이션**: 부드러운 전환 효과
- **진행률 표시**: 실시간 업로드 상태

## 🔧 개발 도구

```bash
# 린트 검사
npm run lint

# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm start
```

## 📄 라이선스

MIT License

---

AI 기반 사진 멘토링을 통해 사진 실력 향상에 도움을 드립니다. 🎯