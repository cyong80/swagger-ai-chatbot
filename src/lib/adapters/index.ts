/**
 * LLM Provider 어댑터 레지스트리 (OCP: 확장 가능, 수정 불필요)
 */
import type { ILLMAdapter, ProviderKey } from "../types";
import { GeminiAdapter } from "./gemini-adapter";
import { OpenAIAdapter } from "./openai-adapter";
import { ClaudeAdapter } from "./claude-adapter";

const adapters: Record<ProviderKey, ILLMAdapter> = {
  gemini: GeminiAdapter,
  openai: OpenAIAdapter,
  claude: ClaudeAdapter,
};

export function getLLMAdapter(provider: ProviderKey): ILLMAdapter {
  const adapter = adapters[provider];
  if (!adapter) {
    throw new Error(`지원하지 않는 provider: ${provider}`);
  }
  return adapter;
}
