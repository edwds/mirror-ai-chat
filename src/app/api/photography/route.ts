import { NextResponse } from 'next/server';
import { getPhotographyAdvice } from '@/lib/openai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { sql } from '@vercel/postgres';

export async function POST(req: Request) {
  try {
    const { query, history } = await req.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // 세션에서 user id 추출
    const session = await getServerSession(authOptions);
    let userInfo = null;
    if (session?.user?.id) {
      // DB에서 직접 사용자 정보 조회
      const { rows } = await sql`SELECT * FROM users WHERE id = ${session.user.id}`;
      if (rows.length > 0) userInfo = rows[0];
    }

    const advice = await getPhotographyAdvice(query, userInfo, history);
    
    return NextResponse.json({ advice });
  } catch (error) {
    console.error('Error in photography advice API:', error);
    return NextResponse.json(
      { error: 'Failed to get photography advice' },
      { status: 500 }
    );
  }
} 