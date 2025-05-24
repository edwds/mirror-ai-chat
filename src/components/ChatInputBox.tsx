import { Button } from "@/components/ui/button";
import { Paperclip, ArrowUp, Square } from "lucide-react";
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
  BUTTON_AREA
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
}) {
  return (
    <div className="w-full px-4 py-4 bg-[#F0E8FF]">
      <div
        className="relative max-w-3xl mx-auto border border-gray-300 rounded-3xl bg-white px-6 pt-4 pb-4 shadow-md transition-all duration-200"
        style={{ minHeight: chatBoxHeight, maxHeight: chatBoxHeight }}
      >
        <textarea
          ref={chatInputRef}
          className="w-full resize-none bg-transparent text-m outline-none"
          style={{
            height: chatBoxHeight - BUTTON_AREA,
            minHeight: 40,
            maxHeight: chatBoxHeight - BUTTON_AREA,
            overflowY: "auto",
            paddingRight: 48,
            paddingBottom: 0,
          }}
          placeholder="Ask me anything..."
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
            <input
              type="file"
              id="chat-file-upload"
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
            <label
              htmlFor="chat-file-upload"
              className="p-0 w-5 h-5 rounded-full text-gray-600 hover:text-gray-800 cursor-pointer flex items-center justify-center"
            >
              <Paperclip className="w-5 h-5" />
            </label>
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