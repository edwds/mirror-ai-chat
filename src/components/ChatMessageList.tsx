import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowDown, Link2 } from "lucide-react";
import { MessageContent } from "@/components/MessageContent";
import CameraCard from "@/components/CameraCard";
import { ImageUploadPreview } from "@/components/ImageUploadPreview";
import React, { useState, useEffect } from "react";
import type { Message } from "@/types/message";

// 어시스턴트 메시지 버블 분리
function AssistantMessageBubble({ content }: { content: string }) {
  const paragraphs = content.split(/\n{2,}/);
  const [visibleParagraphs, setVisibleParagraphs] = useState(0);

  useEffect(() => {
    setVisibleParagraphs(0);
    if (paragraphs.length === 0) return;
    let current = 0;
    let timer: NodeJS.Timeout | null = null;

    const showNext = () => {
      setVisibleParagraphs(v => v + 1);
      current++;
      if (current < paragraphs.length) {
        timer = setTimeout(showNext, 1000); // 문단 사이 텀 1초
      }
    };
    timer = setTimeout(showNext, 200); // 첫 문단도 살짝 delay

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [content]);

  useEffect(() => {
    const el = document.querySelector('.flex-1.overflow-y-auto.w-full');
    if (el) {
      setTimeout(() => {
        el.scrollTop = el.scrollHeight;
      }, 0);
    }
  }, [visibleParagraphs]);

  return (
    <div className="flex flex-col items-start gap-4 w-full">
      {paragraphs.map((para, i) =>
        i < visibleParagraphs ? (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              damping: 18,
              stiffness: 120,
              duration: 0.9,
            }}
            className="w-full"
          >
            <Card
              className={`p-4 mb-1 shadow-none border-0 bg-white text-black mr-auto rounded-3xl rounded-tl-md max-w-[80%] min-w-[120px] w-fit inline-block break-words`}
              style={{ width: para.length < 40 ? 'fit-content' : undefined }}
            >
              {para.trim()}
            </Card>
          </motion.div>
        ) : null
      )}
    </div>
  );
}

function renderUserMessageWithLinkIcon(content: string) {
  // URL + 텍스트 조합 감지
  const urlAndText = content.trim().match(/^(https?:\/\/[^\s]+)\s+(.+)$/);
  if (urlAndText) {
    const url = urlAndText[1];
    const text = urlAndText[2];
    return (
      <span>
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-white underline mr-1">
        <Link2 className="w-4 h-4 inline-block align-middle relative -top-[-2px]" />
        </a>
        {text}
      </span>
    );
  }
  // 일반 텍스트는 그대로
  return <span>{content}</span>;
}

export function ChatMessageList({
  messages,
  isLoading,
  handleActionClick,
  setMessages
}: {
  messages: Message[];
  isLoading: boolean;
  handleActionClick: (action: string, url: string, idx: number) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {messages.map((msg, idx) => {
        if (msg.role === "image-upload") {
          return (
            <div key={idx} className="flex mb-4 justify-end">
              <div className="flex items-end gap-2 w-full">
                <Card className="p-4 max-w-[85%] relative shadow-none border-0 bg-gradient-to-r from-[#7B47F0] via-[#6055F0] to-[#4762F0] text-white ml-auto rounded-3xl rounded-tr-md">
                  <ImageUploadPreview
                    file={msg.file}
                    onUploadComplete={(url: string) => {
                      setMessages(msgs => {
                        const newMsgs = [...msgs];
                        newMsgs[idx] = { role: "image-options", url };
                        return newMsgs;
                      });
                    }}
                    onUploadError={(error: string) => {
                      setMessages(msgs => {
                        const newMsgs = [...msgs];
                        newMsgs[idx] = { role: "user", content: `[업로드 실패: ${error}]` };
                        return newMsgs;
                      });
                    }}
                  />
                </Card>
              </div>
            </div>
          );
        } else if (msg.role === "camera-info") {
          return (
            <div key={idx} className="flex mb-4 justify-start">
              <div className="flex items-end gap-2 w-full">
                <CameraCard camera={msg.content} />
              </div>
            </div>
          );
        } else if (msg.role === "assistant") {
          return (
            <div key={idx} className="flex mb-4 justify-start">
              <AssistantMessageBubble content={msg.content} />
            </div>
          );
        } else if (msg.role === "user") {
          // 이미지 단독 마크다운 메시지면 Card 없이 이미지만 렌더링
          if (/^!\[.*\]\(.*\)$/.test(msg.content.trim())) {
            const match = msg.content.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
            const alt = match?.[1] || '';
            const src = match?.[2] || '';
            return (
              <div key={idx} className="flex mb-4 justify-end">
                <img
                  src={src}
                  alt={alt}
                  className="w-full max-w-xs h-auto max-h-80 object-cover rounded-2xl shadow-lg mx-auto"
                  style={{ background: "none" }}
                />
              </div>
            );
          } else {
            // URL + 텍스트 조합이면 URL을 링크 아이콘으로 치환
            return (
              <div key={idx} className="flex mb-4 justify-end">
                <div className="flex items-end gap-2 w-full">
                  <Card className="p-4 max-w-[85%] relative shadow-none border-0 bg-gradient-to-r from-[#7B47F0] via-[#6055F0] to-[#4762F0] text-white ml-auto rounded-3xl rounded-tr-md">
                    {renderUserMessageWithLinkIcon(msg.content)}
                  </Card>
                </div>
              </div>
            );
          }
        } else if (msg.role === "image-options") {
          return (
            <div key={idx} className="flex flex-col mb-4 items-end space-y-2">
              <div className="flex justify-end w-full">
                <img
                  src={msg.url}
                  alt="Uploaded"
                  className="w-60 h-auto max-h-80 object-cover rounded-2xl shadow-lg ml-auto"
                />
              </div>
              <div className="flex gap-2 justify-end w-full">
                {!msg.selected ? (
                  ["사진 평가", "레퍼런스 분석", "색감 추출"].map(action => (
                    <Button key={action} size="sm" onClick={() => handleActionClick(action, msg.url, idx)}>
                      {action}
                    </Button>
                  ))
                ) : (
                  <span className="px-4 py-2 bg-indigo-600 rounded-lg text-white">{msg.selected}</span>
                )}
              </div>
            </div>
          );
        }
        return null;
      })}
      {isLoading && (
        <div className="flex mb-4 justify-start">
          <div className="flex items-end gap-2 w-full">
            <Card className="p-4 max-w-[85%] relative shadow-none border-0 bg-white text-black mr-auto rounded-3xl rounded-tl-md">
              <div className="flex gap-2 items-center">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-[bounce_1s_infinite_0ms]" />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-[bounce_1s_infinite_200ms]" />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-[bounce_1s_infinite_400ms]" />
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
} 