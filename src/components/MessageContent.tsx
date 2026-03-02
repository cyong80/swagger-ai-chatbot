import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Segment = { type: "text"; content: string } | { type: "code"; lang: string; content: string };

function parseContent(content: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: content.slice(lastIndex, match.index) });
    }
    segments.push({
      type: "code",
      lang: match[1] || "",
      content: match[2].replace(/^\n|\n$/g, ""),
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    segments.push({ type: "text", content: content.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: "text", content }];
}

interface MessageContentProps {
  content: string;
  isBot?: boolean;
  className?: string;
}

export function MessageContent({
  content,
  isBot = false,
  className,
}: MessageContentProps) {
  const segments = parseContent(content);

  return (
    <div className={cn("min-w-0 w-full max-w-full space-y-2 overflow-hidden overflow-x-hidden", className)}>
      {segments.map((seg, i) =>
        seg.type === "text" ? (
          <p key={i} className="whitespace-pre-wrap break-words">
            {seg.content}
          </p>
        ) : (
          <CodeBlock key={i} code={seg.content} lang={seg.lang} isBot={isBot} />
        ),
      )}
    </div>
  );
}

interface CodeBlockProps {
  code: string;
  lang: string;
  isBot: boolean;
}

function CodeBlock({ code, lang, isBot }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers
    }
  }, [code]);

  return (
    <div className="min-w-0 w-full max-w-full overflow-hidden overflow-x-hidden rounded-lg border border-border bg-code-bg">
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-border/50">
        <span className="text-[11px] font-mono text-muted-foreground">
          {lang || "plaintext"}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 -mr-1 opacity-70 hover:opacity-100"
          onClick={handleCopy}
          aria-label={copied ? "복사됨" : "코드 복사"}
        >
          {copied ? (
            <Check size={14} className="text-success" />
          ) : (
            <Copy size={14} />
          )}
        </Button>
      </div>
      <pre
        className={cn(
          "min-w-0 max-w-full overflow-x-auto p-4 text-sm font-mono",
          isBot
            ? "text-foreground"
            : "text-muted-foreground"
        )}
      >
        <code className="whitespace-pre break-words break-all">{code}</code>
      </pre>
    </div>
  );
}
