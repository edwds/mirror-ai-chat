import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { sql } from "@vercel/postgres";
import { authOptions } from "@/lib/authOptions";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user as any;
    const userId = user.id;
    const email = user.email;
    const { nickname, genre, camera, about } = await req.json();

    // upsert: 있으면 update, 없으면 insert
    await sql`
      INSERT INTO users (id, email, nickname, favorite_genre, camera, about)
      VALUES (${userId}, ${email}, ${nickname}, ${genre}, ${camera}, ${about})
      ON CONFLICT (id) DO UPDATE SET
        nickname = EXCLUDED.nickname,
        favorite_genre = EXCLUDED.favorite_genre,
        camera = EXCLUDED.camera,
        about = EXCLUDED.about;
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("profile API error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = session.user as any;
  const userId = user.id;

  const { rows } = await sql`SELECT * FROM users WHERE id = ${userId}`;
  if (rows.length === 0) {
    return NextResponse.json({ profile: null });
  }
  return NextResponse.json({ profile: rows[0] });
} 