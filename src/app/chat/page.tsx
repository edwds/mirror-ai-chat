"use client";
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, ArrowUp, ArrowDown, Square } from "lucide-react";
import { motion } from "framer-motion";
import React from "react";
import LoginButton from "@/components/LoginButton";
import CameraCard from '@/components/CameraCard';
import { fetchCameraInfo } from '@/lib/fetchCameraInfo';
import { ImageUploadPreview } from '@/components/ImageUploadPreview';
import { MessageContent } from "@/components/MessageContent";
import { simpleMarkdown } from "@/lib/markdown";
import type { Message } from "@/types/message";
import { ChatMessageList } from "@/components/ChatMessageList";
import { ChatInputBox } from "@/components/ChatInputBox";

const SUGGESTIONS = [
  "사진 더 멋지게 찍는 팁 알려줘",
  "입문자용 카메라/렌즈 추천해줘",
  "내 사진, 솔직하게 평가해줘",
  "색감 보정법 알려줘",
  "나만의 사진 스타일 찾고 싶어"
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const [chatBoxHeight, setChatBoxHeight] = useState(100); // 전체 인풋 박스 높이
  const BUTTON_AREA = 60;

  const [isLoading, setIsLoading] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

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
          setChatBoxHeight(100);
        } else {
          const totalHeight = Math.max(
            100,
            Math.min(chatInputRef.current.scrollHeight + BUTTON_AREA, 200)
          );
          setChatBoxHeight(totalHeight);
        }
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setMessages(msgs => [...msgs, { 
        role: "image-upload", 
        file 
      }]);
    }
  };

  const handleSend = async (overrideMessage?: string) => {
    const message = overrideMessage ?? input;
    if (!message.trim() && !file) return;
    // 일반 텍스트 메시지
    setInput("");
    setChatBoxHeight(100);
    setMessages(msgs => [...msgs, { role: "user", content: message }]);
    
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
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-5);

    try {
      const response = await fetch('/api/photography', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: message, history }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error('API 요청 실패');
      const data = await response.json();
      // 응답 메시지 추가
      setMessages(msgs => [...msgs, { role: "assistant", content: data.advice }]);
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

  // STOP 버튼 핸들러
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  };

  // 후속 액션 버튼 클릭 핸들러
  const handleActionClick = (action: string, url: string, idx: number) => {
    // 선택된 액션만 남기기 (명시적으로 image-options 타입으로 설정)
    setMessages(msgs => {
      const newMsgs = [...msgs];
      newMsgs[idx] = { role: "image-options", url, selected: action };
      return newMsgs;
    });
    // LLM 요청 메시지 생성 (이미지 URL + 액션별 프롬프트)
    const prompts: Record<string, string> = {
      "사진 평가": "이 사진을 평가해줘",
      "레퍼런스 분석": "이 사진 처럼 찍고 싶은데 어떻게 하면 될까",
      "색감 추출": "이 사진처럼 보정하고 싶어. 색감을 분석하고 분석 결과로 라이트룸 xmp 파일을 만들어줘"
    };
    const promptText = prompts[action] || action;
    const content = `${url} ${promptText}`;
    // 즉시 handleSend 호출
    handleSend(content);
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
                  className="w-full h-[100px] mb-4 pb-24 border border-gray-300 rounded-3xl text-lg px-6 py-4 resize-none placeholder:text-left placeholder:align-top bg-white/80 backdrop-blur"
                  placeholder="Ask me anything..."
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
                    className="p-2 w-8 h-8 rounded-full text-gray-600 hover:text-gray-800 cursor-pointer flex items-center justify-center"
                  >
                    <Paperclip className="w-4 h-4" />
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
                {SUGGESTIONS.map(s => (
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
                    "
                  >
                    {s}
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
          />
        </>
      )}
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