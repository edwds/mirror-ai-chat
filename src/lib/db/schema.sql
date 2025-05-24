-- 파일 타입과 상태를 위한 ENUM 타입 생성
CREATE TYPE file_type_enum AS ENUM ('image', 'document', 'xmp');
CREATE TYPE file_status_enum AS ENUM ('normal', 'hidden', 'delete');

-- 업로드된 파일을 저장하는 테이블 생성
CREATE TABLE uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  conversation_id UUID,
  file_original_name VARCHAR(255),
  file_type file_type_enum,
  file_url_service TEXT,
  file_url_llm TEXT,
  exif_brand VARCHAR(255),
  exif_model VARCHAR(255),
  exif_lens VARCHAR(255),
  exif_aperture VARCHAR(32),
  exif_shutter VARCHAR(32),
  exif_iso VARCHAR(32),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  status file_status_enum DEFAULT 'normal'
);

-- 인덱스 생성
CREATE INDEX idx_uploaded_files_user_id ON uploaded_files(user_id);
CREATE INDEX idx_uploaded_files_conversation_id ON uploaded_files(conversation_id);
CREATE INDEX idx_uploaded_files_status ON uploaded_files(status); 