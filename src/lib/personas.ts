export interface Persona {
  id: string;
  name: string;
  avatar: string;
  description: string;
  specialties: string[];
}

export const personas: Record<string, Persona> = {
  mirror: {
    id: 'mirror',
    name: 'Mirror',
    avatar: '📸',
    description: '사진 전문 AI 어시스턴트',
    specialties: ['사진 평가', '색감 분석', '카메라 추천', '촬영 기법']
  },
  // 나중에 추가할 페르소나들
  // portrait_expert: {
  //   id: 'portrait_expert',
  //   name: 'Portrait Master',
  //   avatar: '👤',
  //   description: '인물 사진 전문가',
  //   specialties: ['인물 촬영', '조명', '포즈 가이드']
  // },
  // landscape_expert: {
  //   id: 'landscape_expert', 
  //   name: 'Landscape Pro',
  //   avatar: '🏔️',
  //   description: '풍경 사진 전문가',
  //   specialties: ['풍경 촬영', '자연광', '구도']
  // }
};

export const getCurrentPersona = (messageType?: string): Persona => {
  // 현재는 모든 메시지에 대해 기본 페르소나 반환
  // 나중에 메시지 타입에 따라 다른 페르소나를 반환할 수 있음
  return personas.mirror;
}; 