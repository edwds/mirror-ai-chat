import { Button } from "@/components/ui/button";
import { Image, ArrowUp, Square } from "lucide-react";
import React from "react";

export function ChatInputBox({
  input,
  setInput,
  file,
  setFile,
  isLoading,
  handleSend,
  handleStop,
  handleFileChange,
  handleChatInput,
  chatInputRef,
  chatBoxHeight,
  BUTTON_AREA,
  suggestedQuestions,
  onSuggestedQuestionClick,
  onUploadClick
}: {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  file: File | null;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
  isLoading: boolean;
  handleSend: () => void;
  handleStop: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleChatInput: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  chatInputRef: React.RefObject<HTMLTextAreaElement | null>;
  chatBoxHeight: number;
  BUTTON_AREA: number;
  suggestedQuestions: string[];
  onSuggestedQuestionClick: (question: string) => void;
  onUploadClick: () => void;
}) {
  return (
    <div className="w-full px-4 py-4 bg-[#F0E8FF]">
      {/* 제안 질문들 */}
      {suggestedQuestions.length > 0 && (
        <div className="max-w-3xl mx-auto mb-3">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {suggestedQuestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => onSuggestedQuestionClick(question)}
                className="px-4 py-2 bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800 rounded-full border border-gray-200 hover:border-gray-300 text-sm italic transition-all duration-200 backdrop-blur-sm whitespace-nowrap flex-shrink-0"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div
        className="relative max-w-3xl mx-auto border border-gray-300 rounded-3xl bg-white px-6 pt-4 pb-4 shadow-md transition-all duration-200"
        style={{ minHeight: chatBoxHeight, maxHeight: chatBoxHeight }}
      >
        <textarea
          ref={chatInputRef}
          className="w-full resize-none bg-transparent text-m outline-none"
          style={{
            height: chatBoxHeight - BUTTON_AREA,
            minHeight: 46,
            maxHeight: chatBoxHeight - BUTTON_AREA,
            overflowY: "auto",
            paddingRight: 48,
            paddingBottom: 12,
          }}
          placeholder="사진에 대해 무엇이든 물어보세요..."
          value={input}
          onChange={handleChatInput}
          onInput={handleChatInput}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
            }
          }}
          onKeyUp={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              handleSend();
            }
          }}
        />
        {/* 버튼 영역 */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center px-6 pb-3 pointer-events-none">
          <div className="pointer-events-auto">
            <button
              onClick={onUploadClick}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 cursor-pointer rounded-full transition-colors"
            >
              <Image className="w-4 h-4" />
              <span className="text-sm font-medium">사진 업로드</span>
            </button>
          </div>
          {isLoading ? (
            <Button
              type="button"
              onClick={handleStop}
              className="pointer-events-auto rounded-full w-10 h-10 flex items-center justify-center shadow-lg bg-black text-white"
            >
              <Square className="w-5 h-5" fill="currentColor" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() && !file}
              className={`pointer-events-auto rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-all duration-200 ${
                (input.trim() || file)
                  ? "bg-gradient-to-r from-indigo-700 to-purple-700 text-white hover:opacity-90"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <ArrowUp className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 