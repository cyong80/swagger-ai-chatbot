/**
 * 설정 로드/저장 훅 (SRP: 설정 관련 책임만)
 */
import { useState, useEffect } from "react";
import type { ApiKeys, ProviderKey } from "@/lib/types";
import { VALID_PROVIDERS } from "@/lib/types";
import { ChromeStorageService } from "@/lib/services/storage-service";
import { DefaultEncryptionService } from "@/lib/services/encryption-service";

const STORAGE_KEYS = {
  provider: "LLM_PROVIDER",
  gemini: "GEMINI_KEY",
  openai: "OPENAI_KEY",
  claude: "CLAUDE_KEY",
  maxTokens: "MAX_OUTPUT_TOKENS",
} as const;

const DEFAULT_KEYS: ApiKeys = {
  gemini: "",
  openai: "",
  claude: "",
};

const MIN_TOKENS = 256;
const MAX_TOKENS = 32768;
const DEFAULT_MAX_TOKENS = 4096;

export function useSettings(
  storage: typeof ChromeStorageService = ChromeStorageService,
  encryption: typeof DefaultEncryptionService = DefaultEncryptionService
) {
  const [provider, setProviderState] = useState<ProviderKey>("gemini");
  const [keys, setKeys] = useState<ApiKeys>(DEFAULT_KEYS);
  const [maxOutputTokens, setMaxOutputTokensState] = useState(DEFAULT_MAX_TOKENS);

  useEffect(() => {
    storage.get(Object.values(STORAGE_KEYS)).then((res) => {
      const p = res[STORAGE_KEYS.provider];
      if (p && typeof p === "string" && VALID_PROVIDERS.includes(p as ProviderKey)) {
        setProviderState(p as ProviderKey);
      }
      setKeys({
        gemini: encryption.decrypt(
          typeof res[STORAGE_KEYS.gemini] === "string"
            ? (res[STORAGE_KEYS.gemini] as string)
            : ""
        ),
        openai: encryption.decrypt(
          typeof res[STORAGE_KEYS.openai] === "string"
            ? (res[STORAGE_KEYS.openai] as string)
            : ""
        ),
        claude: encryption.decrypt(
          typeof res[STORAGE_KEYS.claude] === "string"
            ? (res[STORAGE_KEYS.claude] as string)
            : ""
        ),
      });
      const mt = res[STORAGE_KEYS.maxTokens];
      if (typeof mt === "number" && mt >= MIN_TOKENS && mt <= MAX_TOKENS) {
        setMaxOutputTokensState(mt);
      }
    });
  }, [storage, encryption]);

  const handleKeyChange = (p: ProviderKey, val: string) => {
    setKeys((prev) => ({ ...prev, [p]: val }));
    storage.set({
      [`${p.toUpperCase()}_KEY`]: encryption.encrypt(val),
    });
  };

  const handleProviderChange = (p: ProviderKey) => {
    setProviderState(p);
    storage.set({ [STORAGE_KEYS.provider]: p });
  };

  const handleMaxOutputTokensChange = (val: number) => {
    const clamped = Math.min(MAX_TOKENS, Math.max(MIN_TOKENS, val));
    setMaxOutputTokensState(clamped);
    storage.set({ [STORAGE_KEYS.maxTokens]: clamped });
  };

  return {
    provider,
    keys,
    maxOutputTokens,
    handleKeyChange,
    handleProviderChange,
    handleMaxOutputTokensChange,
  };
}
