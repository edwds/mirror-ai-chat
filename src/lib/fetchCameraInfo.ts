export async function fetchCameraInfo({ model_name, manufacturer, alias }: { model_name: string, manufacturer: string, alias?: string }) {
  // 1. DB에서 먼저 조회
  let url = `/api/camera?model_name=${encodeURIComponent(model_name)}&manufacturer=${encodeURIComponent(manufacturer)}`;
  if (alias) url = `/api/camera?alias=${encodeURIComponent(alias)}`;
  let res = await fetch(url);
  if (res.ok) {
    const data = await res.json();
    return data;
  }

  // 2. DB에 없으면 LLM 호출
  const llmRes = await fetch('/api/llm-camera', {
    method: 'POST',
    body: JSON.stringify({ model_name, manufacturer, alias }),
    headers: { 'Content-Type': 'application/json' }
  });
  const llmData = await llmRes.json();

  // 3. LLM 결과를 DB에 저장
  await fetch('/api/camera', {
    method: 'POST',
    body: JSON.stringify(llmData),
    headers: { 'Content-Type': 'application/json' }
  });

  // 4. 최종 데이터 반환
  return llmData;
} 