/**
 * Chrome storage 추상화 (DIP: 구현체에 직접 의존하지 않도록)
 */
import type { IStorageService } from "../types";

export const ChromeStorageService: IStorageService = {
  get(keys: string[]): Promise<Record<string, unknown>> {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (res: Record<string, unknown>) => {
        resolve(res);
      });
    });
  },

  set(items: Record<string, unknown>): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set(items, () => resolve());
    });
  },
};
