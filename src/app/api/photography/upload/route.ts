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

    // 2. JSON 데이터 파싱 (이제 파일이 아닌 URL을 받음)
    const body = await req.json();
    const { file_url, file_id, original_name, file_size } = body;
    
    if (!file_url || !file_id) {
      return NextResponse.json({ error: 'file_url and file_id are required' }, { status: 400 });
    }

    // 3. 업로드된 이미지를 URL에서 다운로드
    const imageResponse = await fetch(file_url);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch uploaded image');
    }
    
    const buffer = Buffer.from(await imageResponse.arrayBuffer());

    // 4. EXIF 정보 추출
    const exif = await exifr.parse(buffer);

    // 5. 이미지 리사이즈 (색감 분석을 위해 더 높은 해상도 유지)
    const resized1024 = await sharp(buffer)
      .resize({ width: 1024, height: 1024, fit: 'inside' })
      .jpeg({ quality: 95 }) // 색감 보존을 위해 고품질 JPEG 사용
      .toBuffer();
    const resized768 = await sharp(buffer)
      .resize({ width: 768, height: 768, fit: 'inside' })
      .jpeg({ quality: 90 }) // 색감 분석용 중간 해상도
      .toBuffer();

    // 6. 리사이즈된 이미지들을 Blob에 업로드
    const serviceBlob = await put(`service/${userId}/${file_id}/1024.jpg`, resized1024, {
      access: 'public',
    });
    const llmBlob = await put(`llm/${userId}/${file_id}/768.jpg`, resized768, {
      access: 'public',
    });

    // 7. DB 저장
    await sql`
      INSERT INTO uploaded_files (
        id, user_id, file_original_name, file_type, file_url_service, file_url_llm,
        exif_brand, exif_model, exif_lens, exif_aperture, exif_shutter, exif_iso
      ) VALUES (
        ${file_id}, ${userId}, ${original_name || 'unknown'}, 'image', ${serviceBlob.url}, ${llmBlob.url},
        ${exif?.Make || null}, ${exif?.Model || null}, ${exif?.LensModel || null},
        ${exif?.FNumber || null}, ${exif?.ExposureTime || null}, ${exif?.ISO || null}
      )
    `;

    return NextResponse.json({
      id: file_id,
      file_url_service: serviceBlob.url,
      file_url_llm: llmBlob.url,
      original_url: file_url,
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
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Image processing failed' },
      { status: 500 }
    );
  }
} 