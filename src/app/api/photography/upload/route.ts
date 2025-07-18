import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import sharp from 'sharp';
import exifr from 'exifr';
import { sql } from '@vercel/postgres';

// Vercel 함수 설정
export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // 1. 인증된 사용자 정보 가져오기
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. 파일 파싱
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 파일 크기 검사 (30MB 제한)
    if (file.size > 30 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기가 너무 큽니다. 최대 30MB까지 업로드 가능합니다.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 3. EXIF 정보 추출
    const exif = await exifr.parse(buffer);

    // 4. 이미지 리사이즈 (색감 분석을 위해 더 높은 해상도 유지)
    const resized1024 = await sharp(buffer)
      .resize({ width: 1024, height: 1024, fit: 'inside' })
      .jpeg({ quality: 95 }) // 색감 보존을 위해 고품질 JPEG 사용
      .toBuffer();
    const resized768 = await sharp(buffer)
      .resize({ width: 768, height: 768, fit: 'inside' })
      .jpeg({ quality: 90 }) // 색감 분석용 중간 해상도
      .toBuffer();

    // 5. Blob 업로드
    const id = crypto.randomUUID();
    const serviceBlob = await put(`service/${userId}/${id}/1024.jpg`, resized1024, {
      access: 'public',
    });
    const llmBlob = await put(`llm/${userId}/${id}/768.jpg`, resized768, {
      access: 'public',
    });

    // 6. DB 저장
    await sql`
      INSERT INTO uploaded_files (
        id, user_id, file_original_name, file_type, file_url_service, file_url_llm,
        exif_brand, exif_model, exif_lens, exif_aperture, exif_shutter, exif_iso
      ) VALUES (
        ${id}, ${userId}, ${file.name}, 'image', ${serviceBlob.url}, ${llmBlob.url},
        ${exif?.Make || null}, ${exif?.Model || null}, ${exif?.LensModel || null},
        ${exif?.FNumber || null}, ${exif?.ExposureTime || null}, ${exif?.ISO || null}
      )
    `;

    return NextResponse.json({
      id,
      file_url_service: serviceBlob.url,
      file_url_llm: llmBlob.url,
      exif: {
        brand: exif?.Make || null,
        model: exif?.Model || null,
        lens: exif?.LensModel || null,
        aperture: exif?.FNumber || null,
        shutter: exif?.ExposureTime || null,
        iso: exif?.ISO || null
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 