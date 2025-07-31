"use client";
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image, ArrowUp, ArrowDown, Square, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import React from "react";
import LoginButton from "@/components/LoginButton";
import CameraCard from '@/components/CameraCard';
import { fetchCameraInfo } from '@/lib/fetchCameraInfo';
import { ImageUploadPreview } from '@/components/ImageUploadPreview';
import { ImageUploadModal } from '@/components/ImageUploadModal';
import { MessageContent } from "@/components/MessageContent";
import { simpleMarkdown } from "@/lib/markdown";
import type { Message } from "@/types/message";
import { ChatMessageList } from "@/components/ChatMessageList";
import { ChatInputBox } from "@/components/ChatInputBox";
import { signIn, useSession } from "next-auth/react";

const TEXT_SUGGESTION_SETS = [
  [
    "사진 더 멋지게 찍는 팁 알려줘",
    "입문자용 카메라/렌즈 추천해줘", 
    "색감 보정법 알려줘",
    "나만의 사진 스타일 찾고 싶어"
  ],
  [
    "골든아워 촬영법 알려줘",
    "보케 효과 만드는 방법",
    "야경 촬영 설정값 추천",
    "필름 톤 만들기"
  ],
  [
    "실내 인물 촬영 조명 팁",
    "여행용 가벼운 렌즈 추천",
    "미니멀 사진 찍는 법",
    "라이트룸 기본 보정 순서"
  ]
];

const IMAGE_SUGGESTIONS = [
  { icon: "🎯", text: "사진 평가", action: "photo-review" },
  { icon: "🔍", text: "레퍼런스 분석", action: "reference-analysis" },
  { icon: "🎨", text: "색감 추출", action: "color-analysis" }
];

export default function ChatPage() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const [chatBoxHeight, setChatBoxHeight] = useState(112); // 전체 인풋 박스 높이
  const BUTTON_AREA = 60;

  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [currentTextSuggestions, setCurrentTextSuggestions] = useState<string[]>([]);
  const [selectedImageAction, setSelectedImageAction] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // 컴포넌트 마운트 시 랜덤 텍스트 서제스트 셋 선택
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * TEXT_SUGGESTION_SETS.length);
    setCurrentTextSuggestions(TEXT_SUGGESTION_SETS[randomIndex]);
  }, []);

  // photo-review 메시지들을 텍스트로 변환하여 히스토리에 포함하는 함수
  const convertToHistoryMessage = (msg: any) => {
    if (msg.role === 'photo-review-summary') {
      const review = msg.content;
      return {
        role: 'assistant',
        content: `사진 평가: ${review.summary?.comment} (${Math.round((review.summary?.score || 0) * 20)}점)\n강점: ${review.feedback?.strengths?.join(', ')}\n개선점: ${review.feedback?.weaknesses?.join(', ')}`
      };
    }
    if (msg.role === 'photo-review-details') {
      const review = msg.content;
      const scores = Object.entries(review.detailed_scores || {})
        .map(([key, score]) => `${key}: ${Math.round((score as number) * 20)}`)
        .join(', ');
      return {
        role: 'assistant',
        content: `상세 평가 점수: ${scores}`
      };
    }
    if (msg.role === 'color-analysis') {
      const analysis = msg.content;
      return {
        role: 'assistant',
        content: `색감 분석: ${analysis.summary?.style} - ${analysis.summary?.mood}\n주요 색상: ${analysis.summary?.dominant_colors?.join(', ')}\n분석 완료 및 XMP 파일 제공`
      };
    }
    return msg;
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setIsAtBottom(atBottom);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      setTimeout(() => {
        el.scrollTop = el.scrollHeight;
      }, 0);
    }
  }, [messages]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleChatInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    requestAnimationFrame(() => {
      if (chatInputRef.current) {
        // 실제 값이 비었거나 줄바꿈만 남았으면 min으로!
        const plainValue = chatInputRef.current.value.replace(/\s/g, "");
        if (!plainValue) {
          setChatBoxHeight(112);
        } else {
          const totalHeight = Math.max(
            112,
            Math.min(chatInputRef.current.scrollHeight + BUTTON_AREA, 200)
          );
          setChatBoxHeight(totalHeight);
        }
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileChange 시작 - selectedImageAction:', selectedImageAction);
    if (!session) {
      const ok = window.confirm("파일 첨부 기능은 로그인 사용자만 사용할 수 있습니다. 로그인 하시겠습니까?");
      if (ok) {
        signIn("google");
      }
      // 파일 인풋 초기화 (같은 파일 재선택 가능하게)
      if (e.target) e.target.value = "";
      setSelectedImageAction(null); // 초기화
      return;
    }
    
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 검사
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      if (e.target) e.target.value = "";
      return;
    }

    // 파일 크기 검사 (100MB 제한)
    if (file.size > 100 * 1024 * 1024) {
      alert('파일 크기가 너무 큽니다. 최대 100MB까지 업로드 가능합니다.');
      if (e.target) e.target.value = "";
      return;
    }

    // 직접 업로드 진행
    setFile(file);
    
    // 선택된 이미지 액션이 있으면 selectedAction과 함께 메시지 추가
    if (selectedImageAction) {
      console.log('selectedAction과 함께 메시지 추가:', selectedImageAction);
      setMessages(msgs => [...msgs, { 
        role: "image-upload", 
        file,
        selectedAction: selectedImageAction
      }]);
      setSelectedImageAction(null); // 초기화
    } else {
      console.log('일반 이미지 업로드 메시지 추가');
      setMessages(msgs => [...msgs, { 
        role: "image-upload", 
        file 
      }]);
    }
  };

  // 이미지 서제스트 클릭 핸들러
  const handleImageSuggestionClick = (action: string) => {
    console.log('이미지 서제스트 클릭:', action);
    if (!session) {
      const ok = window.confirm("사진 분석 기능은 로그인 사용자만 사용할 수 있습니다. 로그인 하시겠습니까?");
      if (ok) {
        signIn("google");
      }
      return;
    }
    setSelectedImageAction(action);
    setIsUploadModalOpen(true);
  };

  // 이미지 액션 실행 함수
  const executeImageAction = async (action: string, imageFile: File) => {
    if (!imageFile) return;

    // 우선 이미지 업로드 처리
    const formData = new FormData();
    formData.append('file', imageFile);

    try {
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) throw new Error('업로드 실패');
      const { url: imageUrl } = await uploadResponse.json();

      // 각 액션에 따라 다른 기능 실행
      switch (action) {
        case 'photo-review':
          handleActionClick("사진 평가", imageUrl, messages.length, null);
          break;
        case 'reference-analysis':
          handleActionClick("레퍼런스 분석", imageUrl, messages.length, null);
          break;
        case 'color-analysis':
          handleActionClick("색감 추출", imageUrl, messages.length, null);
          break;
      }
    } catch (error) {
      console.error('이미지 처리 오류:', error);
      setMessages(msgs => [...msgs, { 
        role: "assistant", 
        content: "이미지 처리 중 오류가 발생했습니다." 
      }]);
    }
  };

  // 히스토리에서 사진 선택 핸들러
  const handlePhotoSelect = (photo: any) => {
    console.log('히스토리에서 사진 선택:', photo, 'selectedAction:', selectedImageAction);
    
    if (selectedImageAction) {
      // 바로 해당 액션 실행
      const actionMap: Record<string, string> = {
        'photo-review': '사진 평가',
        'reference-analysis': '레퍼런스 분석',
        'color-analysis': '색감 추출'
      };
      const selectedKey = actionMap[selectedImageAction];
      
      // 메시지 추가 (이미 처리된 사진이므로 image-options로 바로 추가)
      setMessages(msgs => [...msgs, { 
        role: "image-options", 
        url: photo.serviceUrl,
        exif: photo.exif,
        selected: selectedKey,
        selectedAction: selectedImageAction
      }]);
      
      // 바로 해당 액션 실행
      setTimeout(() => {
        handleActionClick(selectedKey, photo.serviceUrl, messages.length, photo.exif);
      }, 100);
      
      setSelectedImageAction(null); // 초기화
    } else {
      // 일반적인 경우 - 선택지 표시
      setMessages(msgs => [...msgs, { 
        role: "image-options", 
        url: photo.serviceUrl,
        exif: photo.exif
      }]);
    }
  };

  // 새 파일 선택 핸들러 (모달에서)
  const handleNewFileSelect = (file: File) => {
    setFile(file);
    
    // 선택된 이미지 액션이 있으면 selectedAction과 함께 메시지 추가
    if (selectedImageAction) {
      setMessages(msgs => [...msgs, { 
        role: "image-upload", 
        file,
        selectedAction: selectedImageAction
      }]);
      setSelectedImageAction(null); // 초기화
    } else {
      setMessages(msgs => [...msgs, { 
        role: "image-upload", 
        file 
      }]);
    }
  };

  const handleSend = async (overrideMessage?: string, isHidden?: boolean) => {
    const message = overrideMessage ?? input;
    if (!message.trim() && !file) return;
    // 일반 텍스트 메시지
    setInput("");
    setChatBoxHeight(112);
    // 제안 질문 초기화
    setSuggestedQuestions([]);
    
    // 숨김 모드가 아닐 때만 사용자 메시지 추가
    if (!isHidden) {
      setMessages(msgs => [...msgs, { role: "user", content: message }]);
    }
    
    if (file) {
      setFile(null);
    }

    setTimeout(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 0);

    setIsLoading(true);

    // AbortController 생성
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 방금 보낸 메시지를 포함해서 history 추출
    const nextMessages = [
      ...messages,
      { role: "user", content: message }
    ];
    
    const history = nextMessages
      .map(convertToHistoryMessage)
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-10);

    try {
      const response = await fetch('/api/photography', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: message, history }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error('API 요청 실패');
      const data = await response.json();
      
      // 제안 질문 파싱
      const suggestedQuestionsMatch = data.advice.match(/\[SUGGESTED_QUESTIONS\]\s*(\[[\s\S]*?\])/);
      let content = data.advice;
      let suggestedQuestions: string[] | undefined;
      
      if (suggestedQuestionsMatch) {
        try {
          const questionsArray = JSON.parse(suggestedQuestionsMatch[1]);
          if (Array.isArray(questionsArray) && questionsArray.length > 0) {
            suggestedQuestions = questionsArray;
            // 제안 질문 부분을 응답에서 제거
            content = data.advice.replace(/\[SUGGESTED_QUESTIONS\]\s*\[[\s\S]*?\]/, '').trim();
          }
        } catch (parseError) {
          console.warn('제안 질문 파싱 실패:', parseError);
        }
      }
      
      // 응답 메시지 추가 (제안 질문은 메시지에 저장)
      setMessages(msgs => [...msgs, { role: "assistant", content, suggestedQuestions }]);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        setMessages(msgs => [...msgs, { role: "assistant", content: "⏹️ 응답이 중단되었습니다." }]);
      } else {
        setMessages(msgs => [...msgs, { role: "assistant", content: "죄송합니다. 응답을 생성하는 중에 오류가 발생했습니다." }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // 사진 평가 전용 핸들러
  const handlePhotoReview = async (prompt: string, imageUrl: string) => {
    setIsLoading(true);

    // AbortController 생성
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 기존 메시지에서 history 추출 (photo-review 메시지들도 변환하여 포함)
    const history = messages
      .map(convertToHistoryMessage)
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-10);

    try {
      const response = await fetch('/api/photography', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: prompt, history }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error('API 요청 실패');
      const data = await response.json();
      
      // JSON 파싱 시도
      try {
        const reviewData = JSON.parse(data.advice);
        if (reviewData.type === 'photo-review') {
          // 제안 질문 저장
          if (reviewData.suggested_questions) {
            setSuggestedQuestions(reviewData.suggested_questions);
          }
          // 두 개의 메시지로 분리: 요약 + 상세평가
          setMessages(msgs => [
            ...msgs, 
            { 
              role: "photo-review-summary", 
              content: reviewData, 
              imageUrl 
            },
            { 
              role: "photo-review-details", 
              content: reviewData 
            }
          ]);
        } else {
          // JSON이지만 예상된 형식이 아닌 경우 일반 메시지로 처리
          setMessages(msgs => [...msgs, { role: "assistant", content: data.advice }]);
        }
      } catch (parseError) {
        // JSON 파싱 실패 시 일반 메시지로 처리
        setMessages(msgs => [...msgs, { role: "assistant", content: data.advice }]);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        setMessages(msgs => [...msgs, { role: "assistant", content: "⏹️ 응답이 중단되었습니다." }]);
      } else {
        setMessages(msgs => [...msgs, { role: "assistant", content: "죄송합니다. 사진 평가 중에 오류가 발생했습니다." }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // 색감 분석 전용 핸들러
  const handleColorAnalysis = async (prompt: string, imageUrl: string) => {
    console.log('색감 분석 시작:', { prompt, imageUrl });
    setIsLoading(true);
    
    console.log('Current messages before API call:', messages.length);

    // AbortController 생성
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 기존 메시지에서 history 추출
    const history = messages
      .map(convertToHistoryMessage)
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-10);

    try {
      const response = await fetch('/api/photography', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: prompt, history }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error('API 요청 실패');
      const data = await response.json();
      console.log('API 응답 받음:', data);
      console.log('Raw LLM response:', data.advice);
      
      // JSON 파싱 시도 (+ 기호 제거 전처리)
      try {
        // JSON에서 숫자 앞의 + 기호 제거
        const cleanedJson = data.advice.replace(/:\s*\+(\d)/g, ': $1');
        console.log('Cleaned JSON:', cleanedJson);
        const colorData = JSON.parse(cleanedJson);
        console.log('JSON 파싱 성공:', colorData);
        if (colorData.type === 'color-analysis') {
          console.log('색감 분석 타입 확인됨, 메시지 추가 중...');
          console.log('Adding message with colorData:', colorData);
          console.log('Image URL:', imageUrl);
          // 제안 질문 저장
          if (colorData.suggested_questions) {
            setSuggestedQuestions(colorData.suggested_questions);
          }
          // 색감 분석 메시지 추가
          setMessages(msgs => {
            const colorAnalysisMessage: Message = { 
              role: "color-analysis", 
              content: colorData, 
              imageUrl 
            };
            const newMsgs = [...msgs, colorAnalysisMessage];
            console.log('New messages array length:', newMsgs.length);
            console.log('Last message:', newMsgs[newMsgs.length - 1]);
            return newMsgs;
          });
        } else {
          console.log('예상과 다른 타입:', colorData.type);
          // JSON이지만 예상된 형식이 아닌 경우 일반 메시지로 처리
          setMessages(msgs => [...msgs, { role: "assistant", content: data.advice }]);
        }
      } catch (parseError) {
        console.log('JSON 파싱 실패:', parseError, 'Raw response:', data.advice);
        // JSON 파싱 실패 시 일반 메시지로 처리
        setMessages(msgs => [...msgs, { role: "assistant", content: data.advice }]);
      }
    } catch (error: unknown) {
      console.error('색감 분석 오류:', error);
      if (error instanceof Error && error.name === "AbortError") {
        setMessages(msgs => [...msgs, { role: "assistant", content: "⏹️ 응답이 중단되었습니다." }]);
      } else {
        setMessages(msgs => [...msgs, { role: "assistant", content: "죄송합니다. 색감 분석 중에 오류가 발생했습니다." }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // STOP 버튼 핸들러
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  };

  // 제안 질문 클릭 핸들러
  const handleSuggestedQuestionClick = (question: string) => {
    setInput(question);
    setSuggestedQuestions([]); // 질문 선택 후 제안 질문들 숨김
    // 포커스를 텍스트 입력창으로 이동
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  };

  // 후속 액션 버튼 클릭 핸들러
  const handleActionClick = (action: string, url: string, idx: number, exif?: any) => {
    setMessages(msgs => {
      const newMsgs = [...msgs];
      newMsgs[idx] = { role: "image-options", url, exif, selected: action };
      return newMsgs;
    });
    // 본격적인 사진 분석 프롬프트 생성
    if (action === "사진 평가") {
      const reviewer = "Barbara London";
      const exifText = exif ?
        `카메라: ${exif.brand || "-"} ${exif.model || "-"}\n렌즈: ${exif.lens || "-"}\n조리개: ${exif.aperture || "-"}\n셔터: ${exif.shutter || "-"}\nISO: ${exif.iso || "-"}`
        : "(EXIF 정보 없음)";
      const prompt = `아래 이미지를 전문 사진가의 시각으로 평가해 주세요.\n\n[이미지 URL]\n${url}\n\n[EXIF 정보]\n${exifText}\n\n[중요 지침]\n- EXIF 정보에서 "-" 또는 정보가 없는 항목은 응답에서 제외하거나 null로 설정하세요\n- 추측하지 말고 실제 데이터만 사용하세요\n- Unknown, likely, estimated 같은 추정 표현은 사용하지 마세요\n\n[요구 사항]\n- 한줄평, 5점 만점 점수, 카메라/렌즈/세팅, (가능하다면 ${reviewer}의 시각으로)\n- 강점 3가지, 개선점 3가지, 개선 방향성\n- composition, lighting, color, focus, creativity 5개 항목의 점수(1~5, 소수점 가능)와 각 항목별 상세 설명\n- 사용자가 이 평가를 바탕으로 추가로 궁금해할 만한 내용 3가지 제안 (AI가 질문하는 형태가 아닌, 사용자가 요청할 만한 내용)\n- 아래 JSON 스키마로만 답변(텍스트, 설명, 기타 부가정보 없이 JSON만 반환)\n\n[JSON 예시]\n{\n  "type": "photo-review",\n  "summary": {\n    "comment": "구도와 색감이 뛰어난 사진입니다.",\n    "score": 4.7,\n    "exif": {\n      "camera": "Sony A7 IV",\n      "lens": "FE 85mm F1.4 GM",\n      "aperture": "f/1.4",\n      "shutter": "1/500s",\n      "iso": "100"\n    },\n    "reviewer": "Barbara London"\n  },\n  "feedback": {\n    "strengths": ["표정 포착", "색감", "배경 흐림"],\n    "weaknesses": ["프레이밍", "하이라이트", "거리 부족"],\n    "direction": "프레이밍을 정돈하고 하이라이트 보정에 신경 쓰세요."\n  },\n  "detailed_scores": {\n    "composition": 4.5,\n    "lighting": 4.0,\n    "color": 4.8,\n    "focus": 4.2,\n    "creativity": 4.6\n  },\n  "detailed_comments": {\n    "composition": "프레임 중앙 안정감, 여백 추가 추천.",\n    "lighting": "자연광 활용, 하이라이트 일부 날아감.",\n    "color": "피부톤과 배경색 조화 우수.",\n    "focus": "눈에 정확히 초점.",\n    "creativity": "표정과 포즈 개성."\n  },\n  "suggested_questions": [\n    "이 사진을 더 드라마틱하게 편집하는 방법 알려줘",\n    "비슷한 스타일의 레퍼런스 사진들 보여줘",\n    "이 구도로 다른 장소에서 찍을 때 주의점 알려줘"\n  ]\n}`;
      // 사진 평가는 숨김 모드로 전송하고, 응답을 photo-review 타입으로 처리
      handlePhotoReview(prompt, url);
      return;
    }
    if (action === "색감 추출") {
      const prompt = `이 사진의 색감을 정밀하게 분석하고 실제 이미지의 색상 특성을 정확히 반영한 라이트룸 편집 설정을 제공해 주세요.

[이미지 URL]
${url}

[분석 지침]
1. **실제 이미지 관찰**: 이미지를 자세히 관찰하여 정확한 색상, 밝기, 대비를 파악하세요
2. **색상 추출**: 이미지에서 실제로 보이는 주요 색상들을 정확한 HEX 코드로 추출하세요
3. **현실적 보정값**: 실제 라이트룸에서 사용할 수 있는 현실적인 범위 내의 값들을 제공하세요
4. **세밀한 조정**: 이미지의 특성에 맞는 세밀한 HSL 및 색상 그레이딩 설정을 제공하세요

[요구 사항]
- 색온도, 틴트, 노출, 하이라이트, 섀도우, 화이트, 블랙, 텍스처, 선명도, 생동감, 채도 등 정밀 분석
- 8개 색상대역별 HSL 조정값 (실제 이미지 색상 기반)
- 톤커브 4단계 조정값
- 하이라이트/미드톤/섀도우별 색상 그레이딩
- 실제 이미지에서 추출한 정확한 색상 팔레트 (HEX 코드)
- 아래 JSON 스키마로만 답변 (텍스트 설명 없이 순수 JSON만)

[JSON 스키마]
{
  "type": "color-analysis",
  "summary": {
    "style": "이미지의 실제 색감 스타일 설명",
    "mood": "이미지에서 느껴지는 분위기",
    "dominant_colors": ["실제 이미지의 주요 색상 3-5개"]
  },
  "analysis": {
    "color_palette": ["#정확한HEX1", "#정확한HEX2", "#정확한HEX3", "#정확한HEX4", "#정확한HEX5"],
    "temperature_bias": "실제 이미지의 색온도 경향 (warm/neutral/cool)",
    "saturation_level": "실제 채도 수준 (low/medium/high)",
    "contrast_type": "실제 대비 특성 (soft/medium/high)",
    "key_adjustments": ["실제 필요한 주요 보정사항1", "보정사항2", "보정사항3"]
  },
  "lightroom_settings": {
    "basic": {
      "temperature": 실제값_범위_2000_to_9000,
      "tint": 실제값_범위_minus150_to_plus150,
      "exposure": 실제값_범위_minus5_to_plus5,
      "highlights": 실제값_범위_minus100_to_plus100,
      "shadows": 실제값_범위_minus100_to_plus100,
      "whites": 실제값_범위_minus100_to_plus100,
      "blacks": 실제값_범위_minus100_to_plus100,
      "texture": 실제값_범위_minus100_to_plus100,
      "clarity": 실제값_범위_minus100_to_plus100,
      "vibrance": 실제값_범위_minus100_to_plus100,
      "saturation": 실제값_범위_minus100_to_plus100
    },
    "hsl": {
      "red": {"hue": 실제값_minus100_to_plus100, "saturation": 실제값, "luminance": 실제값},
      "orange": {"hue": 실제값, "saturation": 실제값, "luminance": 실제값},
      "yellow": {"hue": 실제값, "saturation": 실제값, "luminance": 실제값},
      "green": {"hue": 실제값, "saturation": 실제값, "luminance": 실제값},
      "aqua": {"hue": 실제값, "saturation": 실제값, "luminance": 실제값},
      "blue": {"hue": 실제값, "saturation": 실제값, "luminance": 실제값},
      "purple": {"hue": 실제값, "saturation": 실제값, "luminance": 실제값},
      "magenta": {"hue": 실제값, "saturation": 실제값, "luminance": 실제값}
    },
    "tone_curve": {
      "highlights": 실제값_minus100_to_plus100,
      "lights": 실제값_minus100_to_plus100,
      "darks": 실제값_minus100_to_plus100,
      "shadows": 실제값_minus100_to_plus100
    },
    "color_grading": {
      "shadows": {"hue": 실제값_0_to_360, "saturation": 실제값_0_to_100, "luminance": 실제값_minus100_to_plus100},
      "midtones": {"hue": 실제값_0_to_360, "saturation": 실제값_0_to_100, "luminance": 실제값_minus100_to_plus100},
      "highlights": {"hue": 실제값_0_to_360, "saturation": 실제값_0_to_100, "luminance": 실제값_minus100_to_plus100}
    }
  },
  "suggested_questions": [
            "이 색감을 다른 시간대 사진에도 적용하는 방법 알려줘",
        "반대 색감 스타일로 편집하는 방법도 알려줘", 
        "이 색감과 어울리는 의상이나 소품 추천해줘"
  ]
}`;
      handleColorAnalysis(prompt, url);
      return;
    }
    
    // 레퍼런스 분석은 기존 방식 유지
    const prompts: Record<string, string> = {
      "레퍼런스 분석": "이 사진 처럼 찍고 싶은데 어떻게 하면 될까"
    };
    const promptText = prompts[action] || action;
    const prompt = `[이미지 URL]\n${url}\n\n${promptText}`;
    handlePhotoReview(prompt, url);
  };

  return (
    <div className="flex flex-col h-screen w-full relative bg-[#F0E8FF]">
      {/* 헤더 (초기 상태) */}
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
          {/* 로그인 버튼 우측 상단 */}
          <div className="absolute top-6 right-8 z-20">
            <LoginButton />
          </div>
          {/* 그라데이션 배경 */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-700 opacity-90 z-0 animate-gradient-x bg-[length:200%_100%] bg-[position:0%_50%] hover:bg-[position:100%_50%] transition-[background-position] duration-[5s] ease-in-out" />
          <div className="w-full max-w-3xl mx-auto flex flex-col items-center relative z-10">
            <div className="text-7xl font-extrabold mb-3 text-center leading-none select-none text-white drop-shadow-lg">mirror.</div>
            <div className="text-center text-white/70 text-2xl mb-10 drop-shadow">
              Elevate your photography with AI-powered image analysis
            </div>
            <div className="w-full flex flex-col items-center">
              <div className="w-full relative">
                <Textarea
                  ref={inputRef}
                  className="w-full h-[112px] mb-4 pb-24 border border-gray-300 rounded-3xl text-lg px-6 py-4 resize-none placeholder:text-left placeholder:align-top bg-white/80 backdrop-blur"
                  placeholder="사진에 대해 무엇이든 물어보세요..."
                  rows={4}
                  value={input}
                  onChange={handleInput}
                  onInput={handleInput}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                    }
                  }}
                  onKeyUp={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      handleSend();
                    }
                  }}
                />
                <div className="absolute left-3 bottom-3 -translate-y-1/2">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-gray-900 cursor-pointer rounded-full border border-gray-200/50 hover:border-gray-300 transition-colors"
                  >
                    <Image className="w-4 h-4" />
                    <span className="text-sm font-medium">사진 분석</span>
                  </label>
                </div>
                <Button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!input.trim() && !file || isLoading}
                  className={`absolute right-4 bottom-3 -translate-y-1/2 p-2 w-10 h-10 rounded-full ${
                    (input.trim() || file) && !isLoading
                      ? "bg-gradient-to-r from-indigo-700 to-purple-700 text-white hover:opacity-90 bg-[length:200%_100%] bg-[position:0%_50%] hover:bg-[position:100%_50%] transition-[background-position] duration-[5s] ease-in-out"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <ArrowUp className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {/* 텍스트 서제스트 (말풍선 아이콘) */}
                {currentTextSuggestions.map(s => (
                  <Button
                    key={s}
                    variant="ghost"
                    onClick={() => setInput(s)}
                    className="
                      rounded-full 
                      bg-transparent 
                      text-gray-100/50
                      hover:bg-gray-100/50 
                      hover:text-gray-900 
                      focus:bg-gray-100 
                      focus:text-gray-900
                      transition-colors 
                      px-5 py-2 
                      text-sm
                      shadow-none
                      border-none
                      flex items-center gap-2
                    "
                  >
                    <MessageCircle className="w-4 h-4" />
                    {s}
                  </Button>
                ))}
                
                {/* 이미지 서제스트 (기능별 이모지 아이콘) */}
                {IMAGE_SUGGESTIONS.map(s => (
                  <Button
                    key={s.action}
                    variant="ghost"
                    onClick={() => handleImageSuggestionClick(s.action)}
                    className="
                      rounded-full 
                      bg-transparent 
                      text-gray-100/50
                      hover:bg-gray-100/50 
                      hover:text-gray-900 
                      focus:bg-gray-100 
                      focus:text-gray-900
                      transition-colors 
                      px-5 py-2 
                      text-sm
                      shadow-none
                      border-none
                      flex items-center gap-2
                    "
                  >
                    <span className="text-base">{s.icon}</span>
                    {s.text}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 메시지 영역 (스크롤) */}
      {messages.length > 0 && (
        <>
          <div 
            className="flex-1 overflow-y-auto w-full"
            ref={scrollRef}
            onScroll={handleScroll}
          >
            <ChatMessageList
              messages={messages}
              isLoading={isLoading}
              handleActionClick={handleActionClick}
              setMessages={setMessages}
              setSuggestedQuestions={setSuggestedQuestions}
            />
          </div>

          {!isAtBottom && (
            <div
              className="w-full flex flex-col items-center absolute left-0 right-0 z-20"
              style={{ bottom: chatBoxHeight + 32, pointerEvents: 'none' }}
            >
              <div className="w-full max-w-3xl mx-auto h-24 bg-gradient-to-b from-transparent to-[#F0E8FF] pointer-events-none" />
              <Button
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white text-black shadow-lg hover:bg-gray-800 transition pointer-events-auto -mt-10"
                onClick={() => {
                  const el = scrollRef.current;
                  if (el) el.scrollTop = el.scrollHeight;
                }}
              >
                <ArrowDown className="w-6 h-6" />
              </Button>
            </div>
          )}

          {/* 입력창 고정 */}
          <ChatInputBox
            input={input}
            setInput={setInput}
            file={file}
            setFile={setFile}
            isLoading={isLoading}
            handleSend={() => handleSend()}
            handleStop={handleStop}
            handleFileChange={handleFileChange}
            handleChatInput={handleChatInput}
            chatInputRef={chatInputRef}
            chatBoxHeight={chatBoxHeight}
            BUTTON_AREA={BUTTON_AREA}
            suggestedQuestions={suggestedQuestions}
            onSuggestedQuestionClick={handleSuggestedQuestionClick}
          />
        </>
      )}

      {/* 이미지 업로드 모달 */}
      <ImageUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setSelectedImageAction(null);
        }}
        onFileSelect={handleNewFileSelect}
        onPhotoSelect={handlePhotoSelect}
        selectedAction={selectedImageAction}
      />
    </div>
  );
}

// 카드 하단에 카메라 정보 fetch & 렌더링용 CSR 컴포넌트
function CameraInfoFetcher({ content }: { content: string }) {
  const [camera, setCamera] = useState<any>(null);
  useEffect(() => {
    // 카메라 이름 감지 예시 (실제 서비스에서는 더 정교한 파싱 필요)
    const cameraMatch = content.match(/([A-Za-z0-9\- ]+)(?:\s+by\s+|\s*\(|\s*\[|\s*\{|\s*$)/);
    if (cameraMatch && cameraMatch[1]) {
      // 예시: "Sony a7 IV" 등 감지 시 fetchCameraInfo로 정보 fetch
      fetchCameraInfo({ model_name: cameraMatch[1].trim(), manufacturer: "", alias: cameraMatch[1].trim() })
        .then(setCamera)
        .catch(() => setCamera(null));
    } else {
      setCamera(null);
    }
  }, [content]);
  if (!camera) return null;
  // 에러 응답 처리
  if (camera.error) return null;
  return <div className="mt-4"><CameraCard camera={camera} /></div>;
}