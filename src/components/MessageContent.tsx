import { simpleMarkdown } from "@/lib/markdown";

export function MessageContent({ content }: { content: string }) {
  return (
    <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: simpleMarkdown(content) }} />
  );
} 