import { NextRequest } from 'next/server';
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  const { model_name, manufacturer, alias } = await req.json();

  // system prompt 텍스트 (필요시 JSON schema 부분 상세히 붙여넣으세요)
  const systemPrompt = `
!!! 반드시 아래 JSON만 반환하세요. 코드블록, 설명, 안내문, 마크다운 등은 절대 포함하지 마세요. 순수 JSON만 반환하세요. !!!

# Enhanced Camera Information Extraction Prompt

## Role Definition
You are an expert camera database specialist with comprehensive knowledge of digital cameras, their specifications, market positioning, and user experiences. Your task is to provide detailed, accurate information about cameras in a structured JSON format.

## Input Variables
- **Model Name**: ${model_name}
- **Manufacturer**: ${manufacturer}
- **Alias**: ${alias || 'N/A'}

## Output Requirements

### Successful Response
아래 예시처럼 순수 JSON만 반환하세요.
예시:
{"model_name":"Canon EOS R6","manufacturer":"Canon","release_year":2020}

(실제 응답은 전체 스키마를 채워서 반환)

{
  "model_name": "",
  "manufacturer": "",
  "release_year": null,
  "camera_type": "",
  "positioning": "",
  "production_status": "",
  "user_level": "",
  "learning_curve": "",
  "price": {
    "launch_price_usd": null,
    "current_price_usd": {
      "new": null,
      "used": {
        "min": null,
        "max": null
      }
    },
    "currency": "USD",
    "price_source": "",
    "price_last_updated": "",
    "value_rating": ""
  },
  "regional_availability": {
    "north_america": null,
    "europe": null,
    "asia": null,
    "australia": null,
    "other_regions": []
  },
  "key_features": {
    "sensor": {
      "type": "",
      "size": "",
      "resolution_mp": null,
      "technology": ""
    },
    "lens": {
      "type": "",
      "details": "",
      "zoom_range": "",
      "aperture_range": ""
    },
    "image_processor": "",
    "video": {
      "resolution": "",
      "frame_rate": "",
      "bit_depth": "",
      "log_profiles": []
    },
    "autofocus": {
      "system_type": "",
      "af_points": null,
      "eye_af": null,
      "subject_tracking": null
    },
    "shooting_modes": [],
    "special_shooting_modes": [],
    "exposure_metering_modes": [],
    "in_body_stabilization": null,
    "iso_range": "",
    "burst_rate_fps": null,
    "buffer_capacity": {
      "raw": null,
      "jpeg": null,
      "clearing_time": ""
    },
    "shutter_speed_range": "",
    "flash": {
      "built_in": null,
      "hot_shoe": null,
      "sync_speed": ""
    },
    "connectivity": []
  },
  "external_specs": {
    "dimensions_mm": {
      "width": null,
      "height": null,
      "depth": null
    },
    "weight_g": null,
    "body_material": "",
    "weather_sealing": null,
    "environmental_specs": {
      "dust_water_rating": "",
      "operating_temperature": "",
      "operating_humidity": ""
    },
    "screen": {
      "type": "",
      "size_inches": null,
      "touch": null,
      "resolution_dots": null
    },
    "viewfinder": {
      "type": "",
      "magnification": null,
      "coverage_percent": null,
      "resolution_dots": null
    }
  },
  "technical_specs": {
    "mount_type": "",
    "storage": [],
    "dual_card_slots": null,
    "battery": {
      "model": "",
      "type": "",
      "shots_per_charge": null,
      "charging_options": []
    },
    "interfaces": []
  },
  "video_features": {
    "internal_recording_formats": [],
    "external_recording": null,
    "heat_management": "",
    "audio_features": [],
    "recording_limits": ""
  },
  "smart_features": {
    "ai_functions": [],
    "assist_tools": []
  },
  "pros_cons": {
    "pros": [],
    "cons": []
  },
  "history_and_background": {
    "story": "",
    "notable_users": [],
    "cultural_impact": "",
    "key_timeline": [
      {
        "date": "",
        "event": ""
      }
    ]
  },
  "lens_information": {
    "mount_system_notes": "",
    "recommended_lenses": [
      { "name": "", "type": "", "notes": "" }
    ]
  },
  "recommended_accessories": [
    {
      "type": "",
      "name": "",
      "description": "",
      "compatibility_notes": ""
    }
  ],
  "usage_experience": {
    "handling": "",
    "build_quality": "",
    "viewfinder_experience": "",
    "screen_experience": "",
    "menu_system": "",
    "common_issues": []
  },
  "photography_performance": {
    "strengths": [],
    "limitations": [],
    "typical_image_style": ""
  },
  "firmware_information": {
    "latest_version": "",
    "release_date": "",
    "notable_improvements": [],
    "known_issues": []
  },
  "notable_reviews": [
    {
      "author_publication": "",
      "url": "",
      "summary": "",
      "rating": ""
    }
  ],
  "user_sentiment": {
    "strengths": [],
    "weaknesses": [],
    "general_sentiment": ""
  },
  "image_samples": [
    {
      "source": "",
      "url": ""
    }
  ],
  "community_resources": [
    {
      "type": "",
      "name": "",
      "url": "",
      "description": ""
    }
  ],
  "similar_cameras": [
    {
      "manufacturer": "",
      "model": "",
      "reason": ""
    }
  ],
  "external_links": {
    "official_product_page": "",
    "support_and_manuals": "",
    "firmware_updates": ""
  },
  "data_sources": [
    {
      "name": "",
      "url": "",
      "accessed_date": ""
    }
  ],
  "last_updated": ""
}

### Error Response
If the camera cannot be found or sufficient data is unavailable:
{"error":{"message":"Camera model not found or insufficient data available.","input_model":"${model_name}","input_manufacturer":"${manufacturer}","suggestions":["Check the spelling of the model name","Use both manufacturer and official model name (e.g. 'Sony Alpha 7 IV' instead of 'Sony a7 IV')","Ensure the model exists and is not too obscure","Search for similar camera models"],"similar_models":[{"manufacturer":"","model":"","similarity":""}]}}

## Important Guidelines
1. 반드시 순수 JSON만 반환하세요. 코드블록, 설명, 안내문, 마크다운 등은 절대 포함하지 마세요.
2. **Prioritize Accuracy**: Use null values rather than uncertain data.
3. **Maintain Consistency**: Present similar types of values in the same format.
4. **Strive for Completeness**: Populate all possible fields, clearly noting estimates.
5. **Update Regularly**: Reflect the latest information from the 2024-2025 period.
6. **Follow JSON Standards**: Use correct JSON syntax and avoid trailing commas.
`;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: [
          { type: "input_text", text: systemPrompt }
        ]
      },
      {
        role: "user",
        content: [
          { type: "input_text", text: `${manufacturer} ${model_name}${alias ? " (" + alias + ")" : ""}` }
        ]
      }
    ],
    text: {
      format: { type: "text" }
    },
    reasoning: {},
    tools: [
      {
        type: "web_search_preview",
        user_location: { type: "approximate" },
        search_context_size: "high"
      }
    ],
    temperature: 0.2,
    max_output_tokens: 8000,
    top_p: 1,
    store: true
  });

  // 응답 내용 추출 및 후처리
  let content = response.output_text ?? "";
  content = content.replace(/```json|```/g, '').trim();
  content = content.replace(/,([\s\n]*[}\]])/g, '$1'); // 트레일링 콤마 제거
  content = content.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '').trim(); // 주석 제거
  // JSON 부분만 추출 (가장 바깥 중괄호 기준)
  const jsonMatch = content.match(/({[\s\S]*})/);
  if (jsonMatch) {
    content = jsonMatch[1];
  }
  let json;
  try {
    json = JSON.parse(content);
  } catch (e) {
    // fallback: 가능한 key-value만 추출해서 반환
    const fallback: Record<string, any> = {};
    // key-value 쌍 추출 ("key": value)
    const regex = /"([^"]+)":\s*("[^"]*"|\d+|true|false|null|\[[^\]]*\]|\{[^\}]*\})/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      try {
        fallback[match[1]] = JSON.parse(match[2]);
      } catch {
        fallback[match[1]] = match[2];
      }
    }
    if (Object.keys(fallback).length > 0) {
      return new Response(JSON.stringify({ ...fallback, _warning: '일부 필드만 파싱됨', _raw: content }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: '카메라 정보 파싱 실패', raw: content }), { status: 500 });
  }
  return new Response(JSON.stringify(json), { status: 200 });
}