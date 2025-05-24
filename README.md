# 서비스 구조 (구체적 설명)

## 1. 기술 스택
- **프레임워크**: Next.js (App Router, TypeScript)
- **UI**: React, Tailwind CSS, 커스텀 컴포넌트
- **인증**: NextAuth (Google OAuth)
- **AI/LLM**: OpenAI API (GPT-4.1-mini)
- **DB**: Vercel Postgres
- **이미지 처리**: sharp, exifr, @vercel/blob

## 2. 주요 폴더 및 파일 구조

```
src/
  app/
    api/
      auth/           # 인증(NextAuth) API
      camera/         # 카메라 DB 저장/조회 API
      llm-camera/     # LLM 기반 카메라 정보 추출 API
      photography/    # 사진 업로드/AI 피드백 API
        upload/       # 사진 업로드(Blob+EXIF+DB) API
      profile/        # 사용자 프로필 API
    chat/             # 채팅 메인 페이지
    profile/          # 프로필 설정/수정 페이지
    layout.tsx        # 전체 레이아웃
    page.tsx          # 메인(자동 /chat 리다이렉트)
  components/
    ui/               # 버튼, 카드 등 공통 UI 컴포넌트
    ChatInputBox.tsx  # 채팅 입력창(텍스트/이미지)
    ChatMessageList.tsx # 채팅 메시지 렌더링
    CameraCard.tsx    # 카메라 정보 카드
    ImageUpload.tsx   # 이미지 업로드 UI
    ImageUploadPreview.tsx # 업로드 미리보기+진행
    LoginButton.tsx   # 로그인/로그아웃/프로필 버튼
  lib/
    openai.ts         # OpenAI 연동 및 프롬프트
    fetchCameraInfo.ts# 카메라 정보 DB/LLM 조회
    markdown.ts       # 간단 마크다운 파서
    authOptions.ts    # NextAuth 옵션
  types/
    message.ts        # 채팅 메시지 타입
public/               # 정적 파일(아이콘 등)
```

## 3. 주요 기능별 상세 흐름

### 3-1. 채팅 (AI 사진 멘토)
- **경로**: `/chat` (`src/app/chat/page.tsx`)
- **주요 컴포넌트**: `ChatInputBox`, `ChatMessageList`, `CameraCard`, `ImageUploadPreview`
- **메시지 타입**: user, assistant, camera-info, image-upload, image-options
- **동작 흐름**:
  1. 사용자가 텍스트 입력 또는 이미지를 첨부해 메시지 전송
  2. 텍스트 메시지는 `/api/photography`로 POST → OpenAI로 프롬프트 전송 → AI가 사진 관련 피드백/조언 생성
  3. `/카메라 [모델명]` 명령어 입력 시, DB에서 카메라 정보 조회 → 없으면 LLM에 질의 후 DB에 저장
  4. 이미지 첨부 시, `/api/photography/upload`로 업로드(Blob 저장, EXIF 추출, DB 기록) → 업로드 완료 후 이미지 옵션(사진 평가/색감 추출 등) 선택 가능
  5. 옵션 선택 시, 해당 이미지 URL+프롬프트로 AI 피드백 요청

### 3-2. 프로필 관리
- **경로**: `/profile` (`src/app/profile/page.tsx`)
- **동작**:
  - 로그인한 사용자는 닉네임, 선호 장르, 사용 카메라, 자기소개 등 프로필 정보 조회/수정 가능
  - `/api/profile` GET/POST로 DB에 저장/조회

### 3-3. 인증
- **구현**: NextAuth + Google OAuth (`src/app/api/auth/[...nextauth]/route.ts`)
- **특징**: JWT 기반 세션, 로그인 시 프로필 버튼/로그아웃 노출

### 3-4. 카메라 정보
- **DB 우선 조회**: `/api/camera?model_name=...&manufacturer=...`
- **없으면 LLM 호출**: `/api/llm-camera` → OpenAI로 상세 JSON 스키마 기반 카메라 정보 생성 → DB에 저장
- **카메라 정보 카드**: 주요 스펙, 장단점, 가격 등 표시

### 3-5. 사진 업로드/분석
- **업로드**: `/api/photography/upload` (Blob 저장, EXIF 추출, 리사이즈, DB 기록)
- **분석/피드백**: 업로드 후 AI에게 사진 평가/색감 추출 등 요청 가능

### 3-6. UI/UX
- **모던한 채팅 인터페이스**: 반응형, 다크모드 지원, 애니메이션/프로그레스바
- **마크다운 지원**: 링크, 이미지, 강조 등 간단 마크다운 파싱

## 4. 데이터 흐름 요약

- **채팅**: 사용자 입력 → (명령어/일반/이미지) 분기 → API 호출 → AI/DB 응답 → 메시지 리스트에 렌더링
- **카메라 정보**: DB 우선 → 없으면 LLM → DB 저장 → 사용자에게 카드 형태로 제공
- **사진 업로드**: Blob 저장 + EXIF 추출 + DB 기록 → 업로드 완료 후 AI 분석 요청 가능
- **프로필**: 인증된 사용자만 접근, DB에 정보 저장/조회
