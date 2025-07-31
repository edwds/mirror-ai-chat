import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    // 1. 인증된 사용자 정보 가져오기
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. URL에서 limit 파라미터 추출 (기본값: 9, 3x3 그리드용)
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '9'), 20); // 최대 20개

    // 3. 사용자의 최근 업로드 사진들 조회
    const result = await sql`
      SELECT 
        id,
        file_original_name,
        file_url_service,
        file_url_llm,
        exif_brand,
        exif_model,
        exif_lens,
        exif_aperture,
        exif_shutter,
        exif_iso,
        created_at
      FROM uploaded_files 
      WHERE user_id = ${userId} 
        AND status = 'normal'
        AND file_type = 'image'
      ORDER BY created_at DESC 
      LIMIT ${limit * 2}
    `;

    // 4. 파일명 중복 제거 (최신 것만 유지)
    const seenNames = new Set();
    const uniquePhotos = result.rows
      .filter(row => {
        if (seenNames.has(row.file_original_name)) {
          return false;
        }
        seenNames.add(row.file_original_name);
        return true;
      })
      .slice(0, limit);

    // 5. 결과 포맷팅
    const photos = uniquePhotos.map(row => ({
      id: row.id,
      originalName: row.file_original_name,
      serviceUrl: row.file_url_service,
      llmUrl: row.file_url_llm,
      exif: {
        brand: row.exif_brand,
        model: row.exif_model,
        lens: row.exif_lens,
        aperture: row.exif_aperture,
        shutter: row.exif_shutter,
        iso: row.exif_iso
      },
      createdAt: row.created_at
    }));

    return NextResponse.json({ photos });
  } catch (error) {
    console.error('Error fetching photo history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photo history' },
      { status: 500 }
    );
  }
}