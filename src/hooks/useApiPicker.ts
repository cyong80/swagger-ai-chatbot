/**
 * API 선택 모드 훅 (SRP: API picker 관련 책임만)
 */
import { useCallback } from "react";
import { startApiPicker } from "@/lib/api-picker";
import { buildApiPrompt } from "@/lib/api-prompt";
import type { ITabService } from "@/lib/types";
import { ChromeTabService } from "@/lib/services/tab-service";

export function useApiPicker(
  spec: unknown,
  onSendWithPrompt: (prompt: string) => Promise<void>,
  tabService: ITabService = ChromeTabService
) {
  const handlePickApi = useCallback(async () => {
    const tab = await tabService.getActiveTab();
    if (!tab?.id) return;

    if (!tabService.isInjectableUrl(tab.url)) return;

    const listener = (msg: { type?: string; path?: string; method?: string }) => {
      if (msg.type === "API_PICKED" && msg.path && msg.method) {
        chrome.runtime.onMessage.removeListener(listener);
        const prompt = buildApiPrompt(spec, msg.path, msg.method);
        onSendWithPrompt(prompt);
      }
    };

    chrome.runtime.onMessage.addListener(listener);

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: startApiPicker,
        world: "MAIN",
      });
    } catch {
      chrome.runtime.onMessage.removeListener(listener);
    }
  }, [spec, onSendWithPrompt, tabService]);

  return { handlePickApi };
}
