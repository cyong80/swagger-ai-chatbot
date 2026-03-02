/**
 * LLM 호출 모듈 (OCP: 어댑터 기반 확장)
 */
import { getLLMAdapter } from "./adapters";
import type { Message, ProviderKey } from "./types";

export interface AskAIDebugLog {
  provider: string;
  prompt: string;
  contextLength: number;
  fullPromptLength: number;
  url: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  status?: number;
  requestBody?: Record<string, unknown>;
  responseBody?: unknown;
  error?: string;
  result?: string;
}

export interface AskAIOptions {
  onDebugLog?: (log: AskAIDebugLog) => void;
}

const MAX_HISTORY_CHARS = 6000;
const DEFAULT_MAX_OUTPUT_TOKENS = 4096;

function buildMessagesWithHistory(
  context: string,
  history: Message[],
  currentPrompt: string
): Array<{ role: "user" | "assistant" | "system"; content: string }> {
  const systemContent = `당신은 API 전문가입니다. 다음 OpenAPI 스펙을 참고하여 질문에 답변하세요.\n\nContext:\n${context}`;
  const truncated = history.slice(-20);
  let total = 0;
  const limited: Array<{ role: "user" | "assistant"; content: string }> = [];

  for (let i = truncated.length - 1; i >= 0; i--) {
    const m = truncated[i];
    if (total + m.content.length > MAX_HISTORY_CHARS) break;
    limited.unshift({
      role: m.role === "bot" ? "assistant" : "user",
      content: m.content,
    });
    total += m.content.length;
  }

  return [
    { role: "system", content: systemContent },
    ...limited,
    { role: "user", content: currentPrompt },
  ];
}

export const askAI = async (
  provider: ProviderKey,
  key: string,
  prompt: string,
  context: string,
  history: Message[],
  options?: AskAIOptions & { maxOutputTokens?: number }
): Promise<string> => {
  const maxTokens = options?.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS;
  const startTime = performance.now();
  const messages = buildMessagesWithHistory(context, history, prompt);
  const fullPrompt = messages.map((m) => `${m.role}: ${m.content}`).join("\n\n");

  const log: AskAIDebugLog = {
    provider,
    prompt,
    contextLength: context.length,
    fullPromptLength: fullPrompt.length,
    url: "",
    startTime,
  };

  const notifyDebug = () => {
    log.endTime = performance.now();
    log.durationMs = Math.round(log.endTime - log.startTime);
    options?.onDebugLog?.(log);
  };

  try {
    const adapter = getLLMAdapter(provider);
    const result = await adapter.ask({
      key,
      messages,
      maxOutputTokens: maxTokens,
    });
    log.result = result;
    notifyDebug();
    return result;
  } catch (e) {
    log.error = e instanceof Error ? e.message : String(e);
    notifyDebug();
    throw e;
  }
};
