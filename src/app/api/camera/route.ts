import { sql } from '@vercel/postgres';
import type { CameraInfo } from '@/types/camera';

// LLM JSON 유효성 보정 함수
function sanitizeCameraJson(raw: any): any {
  let str = JSON.stringify(raw);
  // 숫자 언더스코어 제거
  str = str.replace(/([0-9])_([0-9])/g, '$1$2');
  // 제어문자(백스페이스 등) 제거
  str = str.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  // 잘린 문자열(예: url: "https:) 보정: 일단 닫히지 않은 따옴표는 제거
  str = str.replace(/"url":\s*"https:[^"]*$/gm, '');
  // 기타 JSON 파싱 불가 패턴 추가시 여기에 보정
  try {
    return JSON.parse(str);
  } catch {
    // 파싱 실패 시 원본 반환
    return raw;
  }
}

export async function POST(req: Request) {
  const data = await req.json();
  // LLM JSON 유효성 보정
  const sanitized = sanitizeCameraJson(data);
  // LLM 에러 응답 처리: error 필드가 있으면 DB 저장하지 않고 바로 에러 반환
  if (sanitized.error) {
    return new Response(JSON.stringify({ error: sanitized.error, raw: sanitized.raw }), { status: 400 });
  }
  // CameraInfo 타입 검증 및 보정
  const {
    model_name = '',
    manufacturer = '',
    aliases = [],
    release_year = null,
    camera_type = '',
    user_level = '',
    price = null,
    key_features = null,
    external_specs = null,
    technical_specs = null,
    video_features = null,
    smart_features = null,
    pros_cons = null,
    lens_information = null,
    recommended_accessories = null,
    usage_experience = null,
    photography_performance = null,
    firmware_information = null,
    notable_reviews = null,
    user_sentiment = null,
    image_samples = null,
    community_resources = null,
    similar_cameras = null,
    external_links = null,
    data_sources = null,
    raw_json = sanitized
  } = sanitized;

  // 필수 필드 체크
  if (!model_name || !manufacturer) {
    return new Response(JSON.stringify({ error: 'model_name, manufacturer는 필수입니다.' }), { status: 400 });
  }

  await sql`
    INSERT INTO cameras (
      model_name, manufacturer, aliases, release_year, camera_type, user_level, price, key_features, external_specs, technical_specs, video_features, smart_features, pros_cons, lens_information, recommended_accessories, usage_experience, photography_performance, firmware_information, notable_reviews, user_sentiment, image_samples, community_resources, similar_cameras, external_links, data_sources, raw_json, updated_at
    ) VALUES (
      ${model_name}, ${manufacturer}, ${JSON.stringify(aliases)}, ${release_year}, ${camera_type}, ${user_level},
      ${JSON.stringify(price)}, ${JSON.stringify(key_features)}, ${JSON.stringify(external_specs)}, ${JSON.stringify(technical_specs)},
      ${JSON.stringify(video_features)}, ${JSON.stringify(smart_features)}, ${JSON.stringify(pros_cons)}, ${JSON.stringify(lens_information)},
      ${JSON.stringify(recommended_accessories)}, ${JSON.stringify(usage_experience)}, ${JSON.stringify(photography_performance)},
      ${JSON.stringify(firmware_information)}, ${JSON.stringify(notable_reviews)}, ${JSON.stringify(user_sentiment)},
      ${JSON.stringify(image_samples)}, ${JSON.stringify(community_resources)}, ${JSON.stringify(similar_cameras)},
      ${JSON.stringify(external_links)}, ${JSON.stringify(data_sources)}, ${JSON.stringify(raw_json)}, NOW()
    )
    ON CONFLICT (model_name, manufacturer)
    DO UPDATE SET
      aliases = EXCLUDED.aliases,
      release_year = EXCLUDED.release_year,
      camera_type = EXCLUDED.camera_type,
      user_level = EXCLUDED.user_level,
      price = EXCLUDED.price,
      key_features = EXCLUDED.key_features,
      external_specs = EXCLUDED.external_specs,
      technical_specs = EXCLUDED.technical_specs,
      video_features = EXCLUDED.video_features,
      smart_features = EXCLUDED.smart_features,
      pros_cons = EXCLUDED.pros_cons,
      lens_information = EXCLUDED.lens_information,
      recommended_accessories = EXCLUDED.recommended_accessories,
      usage_experience = EXCLUDED.usage_experience,
      photography_performance = EXCLUDED.photography_performance,
      firmware_information = EXCLUDED.firmware_information,
      notable_reviews = EXCLUDED.notable_reviews,
      user_sentiment = EXCLUDED.user_sentiment,
      image_samples = EXCLUDED.image_samples,
      community_resources = EXCLUDED.community_resources,
      similar_cameras = EXCLUDED.similar_cameras,
      external_links = EXCLUDED.external_links,
      data_sources = EXCLUDED.data_sources,
      raw_json = EXCLUDED.raw_json,
      updated_at = NOW();
  `;

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const model_name = searchParams.get('model_name');
  const manufacturer = searchParams.get('manufacturer');
  const alias = searchParams.get('alias');

  let query;
  if (model_name && manufacturer) {
    query = sql`SELECT * FROM cameras WHERE model_name = ${model_name} AND manufacturer = ${manufacturer}`;
  } else if (alias) {
    query = sql`SELECT * FROM cameras WHERE ${alias} = ANY(aliases)`;
  } else {
    return new Response(JSON.stringify({ error: 'model_name+manufacturer 또는 alias 필요' }), { status: 400 });
  }
  const { rows } = await query;
  if (rows.length === 0) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }
  return new Response(JSON.stringify(rows[0]), { status: 200 });
} 