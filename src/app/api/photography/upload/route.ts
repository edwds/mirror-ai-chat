import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import sharp from 'sharp';
import exifr from 'exifr';
import { sql } from '@vercel/postgres';

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

    const buffer = Buffer.from(await file.arrayBuffer());

    // 3. EXIF 정보 추출
    const exif = await exifr.parse(buffer);

    // 4. 이미지 리사이즈
    const resized1024 = await sharp(buffer)
      .resize({ width: 1024, height: 1024, fit: 'inside' })
      .toBuffer();
    const resized512 = await sharp(buffer)
      .resize({ width: 512, height: 512, fit: 'inside' })
      .toBuffer();

    // 5. Blob 업로드
    const id = crypto.randomUUID();
    const serviceBlob = await put(`service/${userId}/${id}/1024.webp`, resized1024, {
      access: 'public',
    });
    const llmBlob = await put(`llm/${userId}/${id}/512.webp`, resized512, {
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
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 