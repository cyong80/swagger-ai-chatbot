import { useEffect, useRef } from "react";
import { Send, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatInput } from "@/components/ChatInput";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageContent } from "@/components/MessageContent";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";

/** 채팅 화면 필수 props (ISP: 최소 인터페이스) */
interface ChatScreenCoreProps {
  messages: Message[];
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isLoading?: boolean;
}

/** Spec/API 선택 관련 선택적 props */
interface ChatScreenSpecProps {
  spec?: unknown;
  onRefreshSpec?: () => void;
  onPickApi?: () => void;
}

type ChatScreenProps = ChatScreenCoreProps & ChatScreenSpecProps;

export function ChatScreen({
  messages,
  input,
  onInputChange,
  onSend,
  isLoading = false,
  spec,
  onRefreshSpec,
  onPickApi,
}: ChatScreenProps) {
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      <ScrollArea className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <div className="min-w-0 max-w-full overflow-x-hidden p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded font-mono text-[10px] text-muted-foreground bg-muted/50 border border-border/50 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                {spec != null ? "connected" : "no spec"}
              </div>
              <p className="text-sm font-medium text-foreground">
                {spec != null
                  ? "Swagger API 문서에 대해 질문해 보세요"
                  : "스펙을 찾을 수 없습니다"}
              </p>
              <p className="text-xs text-muted-foreground mt-2 font-sans">
                {spec != null
                  ? "현재 열린 탭의 OpenAPI 스펙을 기반으로 답변합니다"
                  : "Swagger UI 또는 Redoc 페이지에서 시도해 보세요"}
              </p>
              {spec == null && onRefreshSpec && (
                <button
                  type="button"
                  onClick={onRefreshSpec}
                  className="mt-4 text-xs font-mono text-primary hover:text-primary/90 px-3 py-1.5 rounded border border-border hover:border-primary/50 transition-colors"
                >
                  $ refresh spec
                </button>
              )}
            </div>
          ) : (
            <>
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex min-w-0 w-full animate-in fade-in-0 slide-in-from-bottom-1 duration-200",
                    m.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "min-w-0 max-w-[80%] w-fit overflow-hidden overflow-x-hidden rounded-md px-4 py-3 text-sm",
                      m.role === "user"
                        ? "bg-primary/10 text-foreground ring-1 ring-primary/25 border border-primary/25"
                        : "bg-card/80 text-foreground border border-border ring-1 ring-border/50",
                    )}
                  >
                    <MessageContent
                      content={m.content}
                      isBot={m.role === "bot"}
                      className=""
                    />
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex min-w-0 w-full justify-start animate-in fade-in-0 slide-in-from-bottom-1 duration-200">
                  <div className="min-w-0 max-w-[80%] w-fit overflow-hidden overflow-x-hidden rounded-md px-4 py-3 text-sm bg-card/80 border border-border ring-1 ring-border/50">
                    <div
                      className="flex gap-1.5 items-center font-mono text-muted-foreground text-xs"
                      aria-label="응답 대기 중"
                    >
                      <span
                        className="w-2 h-2 rounded-full bg-current animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-current animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-current animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={scrollAnchorRef} aria-hidden />
        </div>
      </ScrollArea>

      <div className="sticky bottom-0 p-4 border-t border-border bg-background/95 backdrop-blur-sm shrink-0 z-10 ring-1 ring-border/30 -mt-px">
        <div className="flex items-end gap-2">
          {onPickApi && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-md border-border/80 hover:border-primary/50 hover:bg-primary/10 transition-colors"
              onClick={onPickApi}
              disabled={isLoading || !spec}
              title="페이지에서 API 클릭하여 선택"
            >
              <MousePointerClick size={18} aria-hidden />
            </Button>
          )}
          <div className="relative flex-1 flex items-end rounded-md border border-input bg-card/50 ring-1 ring-border/50 focus-within:border-primary focus-within:ring-primary/30 focus-within:ring-2 transition-[color,box-shadow,border-color]">
            <ChatInput
              value={input}
              onChange={onInputChange}
              onSubmit={onSend}
              placeholder="메시지를 입력하세요... (Shift+Enter: 줄바꿈, Enter: 전송, / 경로 자동완성)"
              spec={spec}
              disabled={isLoading}
            />
            <Button
              type="button"
              size="icon"
              className="absolute right-2 bottom-2 h-8 w-8 shrink-0 rounded-md top-unset"
              onClick={onSend}
              disabled={isLoading}
            >
              <Send size={16} aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
