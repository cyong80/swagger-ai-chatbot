/**
 * Spec 추출 훅 (SRP: 스펙 관련 책임만)
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { extractSpecFromPage } from "@/lib/spec-extractor";
import type { ITabService } from "@/lib/types";
import { ChromeTabService } from "@/lib/services/tab-service";

async function fetchSpecFromTab(
  tabService: ITabService
): Promise<{ spec: unknown; tabId?: number; windowId?: number }> {
  const tab = await tabService.getActiveTab();
  if (!tab?.id || !tabService.isInjectableUrl(tab.url)) {
    return { spec: null };
  }
  try {
    const extracted = await tabService.executeScript(extractSpecFromPage);
    if (extracted != null) {
      return {
        spec: extracted,
        tabId: tab.id,
        windowId: tab.windowId,
      };
    }
  } catch (e) {
    console.warn("[Swagger AI] 스펙 추출 실패:", e);
  }
  return { spec: null, tabId: tab.id, windowId: tab.windowId };
}

export function useSpec(
  tabService: ITabService = ChromeTabService,
  options?: { onBeforeReload?: () => void }
) {
  const [spec, setSpec] = useState<unknown>(null);
  const [showReloadConfirm, setShowReloadConfirm] = useState(false);
  const specTabRef = useRef<{ tabId: number; windowId: number } | null>(null);

  const fetchSpec = useCallback(async () => {
    const { spec: result, tabId, windowId } = await fetchSpecFromTab(tabService);
    setSpec(result);
    if (tabId != null && windowId != null) {
      specTabRef.current = { tabId, windowId };
    }
  }, [tabService]);

  useEffect(() => {
    let cancelled = false;
    fetchSpecFromTab(tabService).then(({ spec: result, tabId, windowId }) => {
      if (!cancelled) {
        setSpec(result);
        if (tabId != null && windowId != null) {
          specTabRef.current = { tabId, windowId };
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [tabService]);

  useEffect(() => {
    const listener = (activeInfo: { tabId: number; windowId: number }) => {
      const current = specTabRef.current;
      if (!current) return;
      if (
        activeInfo.windowId === current.windowId &&
        activeInfo.tabId !== current.tabId
      ) {
        setShowReloadConfirm(true);
      }
    };
    chrome.tabs.onActivated.addListener(listener);
    return () => chrome.tabs.onActivated.removeListener(listener);
  }, []);

  const reloadSpec = useCallback(async () => {
    options?.onBeforeReload?.();
    await fetchSpec();
  }, [fetchSpec, options?.onBeforeReload]);

  const onConfirmReload = useCallback(async () => {
    setShowReloadConfirm(false);
    await reloadSpec();
  }, [reloadSpec]);

  const onDismissReloadConfirm = useCallback(() => {
    setShowReloadConfirm(false);
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query(
        { active: true, currentWindow: true },
        ([tab]) => {
          if (tab?.id != null && tab?.windowId != null) {
            specTabRef.current = { tabId: tab.id, windowId: tab.windowId };
          }
        }
      );
    }
  }, []);

  return {
    spec,
    fetchSpec,
    reloadSpec,
    showReloadConfirm,
    onConfirmReload,
    onDismissReloadConfirm,
  };
}
