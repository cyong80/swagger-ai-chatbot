/**
 * 채팅 상태 및 LLM 호출 훅 (SRP: 채팅 관련 책임만)
 */
import { useState, useCallback } from "react";
import { askAI } from "@/lib/ai";
import type { Message, ApiKeys, ProviderKey } from "@/lib/types";

const SPEC_CONTEXT_LIMIT = 5000;

export function useChat(
  provider: ProviderKey,
  keys: ApiKeys,
  spec: unknown,
  maxOutputTokens: number
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const getActiveKey = useCallback((): string => {
    return keys[provider] ?? "";
  }, [keys, provider]);

  const sendMessage = useCallback(
    async (promptText: string, history: Message[]) => {
      const key = getActiveKey();
      if (!key) return;

      const newMessages: Message[] = [
        ...history,
        { role: "user", content: promptText },
      ];
      setMessages(newMessages);
      setIsLoading(true);

      try {
        const context = JSON.stringify(spec).slice(0, SPEC_CONTEXT_LIMIT);
        const response = await askAI(
          provider,
          key,
          promptText,
          context,
          history,
          { maxOutputTokens }
        );
        setMessages((prev) => [...prev, { role: "bot", content: response }]);
      } finally {
        setIsLoading(false);
      }
    },
    [provider, getActiveKey, spec, maxOutputTokens]
  );

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    if (text === "/clear") {
      setMessages([]);
      setInput("");
      return;
    }

    const key = getActiveKey();
    if (!key) return;

    setInput("");
    await sendMessage(text, messages);
  }, [input, messages, getActiveKey, sendMessage]);

  const handleSendWithPrompt = useCallback(
    async (promptText: string) => {
      await sendMessage(promptText, messages);
    },
    [messages, sendMessage]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setInput("");
  }, []);

  return {
    messages,
    input,
    setInput,
    isLoading,
    handleSend,
    handleSendWithPrompt,
    clearMessages,
  };
}
