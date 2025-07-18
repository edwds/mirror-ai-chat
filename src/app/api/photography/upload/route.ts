import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import sharp from 'sharp';
import exifr from 'exifr';
import { sql } from '@vercel/postgres';

export async function POST(req: Request) {
  const startTime = Date.now();
  console.log('🚀 Upload API started');
  
  try {
    // 1. 인증된 사용자 정보 가져오기
    console.log('📋 Checking authentication...');
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    console.log(`✅ User authenticated: ${userId}`);

    // 2. 파일 파싱
    console.log('📁 Parsing form data...');
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      console.log('❌ No file provided in request');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    console.log(`📊 File info: ${file.name}, ${file.size} bytes, ${file.type}`);
    
    // 파일 크기 체크 (20MB 제한)
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
    if (file.size > MAX_FILE_SIZE) {
      console.log(`❌ File too large: ${file.size} bytes (max: ${MAX_FILE_SIZE})`);
      return NextResponse.json({ 
        error: `파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE / 1024 / 1024}MB까지 업로드 가능합니다.` 
      }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    console.log(`📦 Buffer created: ${buffer.length} bytes`);

    // 3. EXIF 정보 추출
    console.log('🔍 Extracting EXIF data...');
    let exif;
    try {
      exif = await exifr.parse(buffer);
      console.log('✅ EXIF extraction completed');
    } catch (exifError) {
      console.warn('⚠️ EXIF extraction failed:', exifError);
      exif = null;
    }

    // 4. 이미지 리사이즈
    console.log('🔧 Starting image processing...');
    const resizeStartTime = Date.now();
    
    let resized1024, resized768;
    try {
      // sharp 설정 최적화
      sharp.cache(false); // 메모리 사용량 최적화
      
      resized1024 = await sharp(buffer)
        .resize({ width: 1024, height: 1024, fit: 'inside' })
        .jpeg({ quality: 95, mozjpeg: true }) // mozjpeg 사용으로 압축 최적화
        .toBuffer();
      console.log(`✅ 1024px resize completed: ${resized1024.length} bytes`);
        
      resized768 = await sharp(buffer)
        .resize({ width: 768, height: 768, fit: 'inside' })
        .jpeg({ quality: 90, mozjpeg: true })
        .toBuffer();
      console.log(`✅ 768px resize completed: ${resized768.length} bytes`);
      
    } catch (sharpError) {
      console.error('❌ Sharp processing failed:', sharpError);
      return NextResponse.json({ 
        error: '이미지 처리 중 오류가 발생했습니다. 다른 이미지를 시도해보세요.' 
      }, { status: 500 });
    }
    
    const resizeTime = Date.now() - resizeStartTime;
    console.log(`⏱️ Image processing took: ${resizeTime}ms`);

    // 5. Blob 업로드
    console.log('☁️ Starting blob upload...');
    const blobStartTime = Date.now();
    const id = crypto.randomUUID();
    
    try {
      const [serviceBlob, llmBlob] = await Promise.all([
        put(`service/${userId}/${id}/1024.jpg`, resized1024, { access: 'public' }),
        put(`llm/${userId}/${id}/768.jpg`, resized768, { access: 'public' })
      ]);
      
      const blobTime = Date.now() - blobStartTime;
      console.log(`✅ Blob upload completed: ${blobTime}ms`);
      console.log(`📎 Service URL: ${serviceBlob.url}`);
      console.log(`📎 LLM URL: ${llmBlob.url}`);

      // 6. DB 저장
      console.log('💾 Saving to database...');
      const dbStartTime = Date.now();
      
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
      
      const dbTime = Date.now() - dbStartTime;
      const totalTime = Date.now() - startTime;
      console.log(`✅ Database save completed: ${dbTime}ms`);
      console.log(`🎉 Total upload time: ${totalTime}ms`);

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
        },
        performance: {
          total_time: totalTime,
          resize_time: resizeTime,
          blob_time: blobTime,
          db_time: dbTime
        }
      });
      
    } catch (blobError) {
      console.error('❌ Blob upload failed:', blobError);
      return NextResponse.json({ 
        error: '이미지 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' 
      }, { status: 500 });
    }
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ Upload API failed after ${totalTime}ms:`, error);
    
    // 에러 타입별 상세 메시지
    let errorMessage = '업로드 중 오류가 발생했습니다.';
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = '업로드 시간이 초과되었습니다. 파일 크기를 줄이고 다시 시도해주세요.';
      } else if (error.message.includes('network')) {
        errorMessage = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.';
      } else if (error.message.includes('memory')) {
        errorMessage = '서버 메모리 부족으로 처리할 수 없습니다. 더 작은 이미지를 시도해주세요.';
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
} 