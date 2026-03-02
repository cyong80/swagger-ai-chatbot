/**
 * 공통 타입 정의 (SRP, LSP, ISP)
 */

// --- 메시지 타입 (Message / ChatMessage 통합) ---
export interface Message {
  role: "user" | "bot";
  content: string;
}

// --- Provider 관련 ---
export type ProviderKey = "gemini" | "openai" | "claude";

export interface ApiKeys {
  gemini: string;
  openai: string;
  claude: string;
}

export const VALID_PROVIDERS: ProviderKey[] = ["gemini", "openai", "claude"];

export const PROVIDER_LABELS: Record<ProviderKey, string> = {
  gemini: "Gemini",
  openai: "OpenAI",
  claude: "Claude",
};

// --- 서비스 인터페이스 (DIP: 추상화에 의존) ---
export interface IStorageService {
  get(keys: string[]): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

export interface ITabService {
  getActiveTab(): Promise<chrome.tabs.Tab | null>;
  executeScript<T>(func: () => T): Promise<T | null>;
  isInjectableUrl(url: string | undefined): boolean;
}

export interface ILLMAdapter {
  readonly provider: ProviderKey;
  ask(params: {
    key: string;
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
    maxOutputTokens: number;
  }): Promise<string>;
}

export interface IEncryptionService {
  encrypt(text: string): string;
  decrypt(cipher: string): string;
}
