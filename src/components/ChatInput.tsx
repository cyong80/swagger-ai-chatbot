"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { filterPathsByQuery } from "@/lib/spec-paths";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  placeholder?: string;
  spec?: unknown;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = "메시지를 입력하세요...",
  spec,
}: ChatInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [caretPos, setCaretPos] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  // 슬래시 이후 텍스트를 쿼리로 사용
  const query = (() => {
    const beforeCaret = value.slice(0, caretPos);
    const lastSlash = beforeCaret.lastIndexOf("/");
    if (lastSlash === -1) return "";
    return beforeCaret.slice(lastSlash + 1).trim();
  })();

  const suggestions = spec
    ? filterPathsByQuery(spec, query, 8)
    : [];

  // 슬래시가 맨 앞이거나 공백 직후인지 확인
  function hasSlashContext(val: string, caretPos: number): boolean {
    const beforeCaret = val.slice(0, caretPos);
    const lastSlash = beforeCaret.lastIndexOf("/");
    if (lastSlash === -1) return false;
    const beforeSlash = beforeCaret.slice(0, lastSlash);
    return lastSlash === 0 || /\s$/.test(beforeSlash);
  }

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const pos = e.target.selectionStart ?? newValue.length;
      setCaretPos(pos);
      onChange(newValue);

      if (!spec) {
        setShowSuggestions(false);
        return;
      }

      if (hasSlashContext(newValue, pos)) {
        const beforeCaret = newValue.slice(0, pos);
        const lastSlash = beforeCaret.lastIndexOf("/");
        const q = beforeCaret.slice(lastSlash + 1).trim();
        const options = filterPathsByQuery(spec, q, 8);
        setShowSuggestions(options.length > 0);
        setSelectedIndex(0);
      } else {
        setShowSuggestions(false);
      }
    },
    [onChange, spec]
  );

  const handleSelect = useCallback(() => {
    const pos = textareaRef.current?.selectionStart ?? 0;
    setCaretPos(pos);
  }, []);

  const applySuggestion = useCallback(
    (path: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = caretPos;
      const beforeCaret = value.slice(0, caretPos);
      const lastSlash = beforeCaret.lastIndexOf("/");
      if (lastSlash === -1) return;

      const prefix = value.slice(0, lastSlash);
      const suffix = value.slice(start);
      const newValue = prefix + path + (suffix ? " " + suffix : "");
      onChange(newValue);
      setShowSuggestions(false);
      setCaretPos(lastSlash + path.length);

      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(lastSlash + path.length, lastSlash + path.length);
      });
    },
    [value, onChange, caretPos]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        if (showSuggestions && suggestions.length > 0) {
          e.preventDefault();
          applySuggestion(suggestions[selectedIndex] ?? "");
          return;
        }
        e.preventDefault();
        if (!disabled) onSubmit?.();
        return;
      }

      if (!showSuggestions || suggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
          return;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          return;
        case "Tab":
          e.preventDefault();
          applySuggestion(suggestions[selectedIndex] ?? "");
          return;
        case "Escape":
          e.preventDefault();
          setShowSuggestions(false);
          return;
        default:
          break;
      }
    },
    [showSuggestions, suggestions, selectedIndex, applySuggestion, onSubmit, disabled]
  );

  useEffect(() => {
    if (showSuggestions && suggestionsRef.current) {
      const el = suggestionsRef.current.children[selectedIndex] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, showSuggestions]);

  return (
    <div className="relative w-full">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onBlur={() => {
          // 클릭 전에 blur가 먼저 발생할 수 있어 짧은 지연
          setTimeout(() => setShowSuggestions(false), 150);
        }}
        placeholder={placeholder}
        rows={2}
        disabled={disabled}
        className="min-h-[72px] max-h-[200px] resize-none border-0 bg-transparent px-4 py-3 pr-20 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul
          ref={suggestionsRef}
          className="absolute bottom-full left-0 right-0 mb-1 max-h-48 overflow-auto rounded-md border border-border bg-popover py-1 shadow-lg z-50 ring-1 ring-border/50 font-mono animate-in fade-in-0 slide-in-from-bottom-1 duration-150"
          role="listbox"
        >
          {suggestions.map((path, i) => (
            <li
              key={path}
              role="option"
              aria-selected={i === selectedIndex}
              className={cn(
                "cursor-pointer px-3 py-2 text-sm transition-colors",
                i === selectedIndex
                  ? "bg-primary/20 text-primary"
                  : "text-popover-foreground hover:bg-muted/50"
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                applySuggestion(path);
              }}
            >
              <code className="text-xs text-foreground">{path}</code>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
