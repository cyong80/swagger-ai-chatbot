/**
 * Chrome Tabs/Scripting API 추상화 (DIP)
 */
import type { ITabService } from "../types";

const NON_INJECTABLE_PREFIXES = [
  "about:blank",
  "chrome://",
  "chrome-extension://",
  "edge://",
];

export const ChromeTabService: ITabService = {
  async getActiveTab(): Promise<chrome.tabs.Tab | null> {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab ?? null;
  },

  async executeScript<T>(func: () => T): Promise<T | null> {
    const tab = await this.getActiveTab();
    const tabId = tab?.id;
    if (tabId == null) return null;

    return new Promise((resolve) => {
      chrome.scripting.executeScript(
        {
          target: { tabId },
          func,
          world: "MAIN",
        },
        (results) => {
          if (chrome.runtime.lastError) {
            resolve(null);
            return;
          }
          resolve((results?.[0]?.result as T) ?? null);
        }
      );
    });
  },

  isInjectableUrl(url: string | undefined): boolean {
    if (!url) return false;
    return !NON_INJECTABLE_PREFIXES.some((p) => url.startsWith(p));
  },
};
