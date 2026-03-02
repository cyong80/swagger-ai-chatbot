/**
 * OpenAPI/Swagger 스펙 추출 함수
 * chrome.scripting.executeScript(world: "MAIN")에서 사용하기 위해
 * 페이지 컨텍스트(window.ui 등)에 접근할 수 있는 self-contained 함수
 */
export function extractSpecFromPage(): unknown {
  // 1. Swagger UI (window.ui.specSelectors.specJson())
  try {
    const ui = (
      window as unknown as {
        ui?: { specSelectors?: { specJson?: () => unknown } };
      }
    ).ui;
    const specJson = ui?.specSelectors?.specJson?.();
    if (specJson != null) {
      if (typeof (specJson as { toJS?: () => unknown }).toJS === "function") {
        return (specJson as { toJS: () => unknown }).toJS();
      }
      return specJson;
    }
  } catch {
    // ignore
  }

  // 2. Redoc (window.redocStore)
  try {
    const redoc = (window as unknown as { redocStore?: { spec?: unknown } })
      .redocStore;
    if (redoc?.spec) return redoc.spec;
  } catch {
    // ignore
  }

  // 3. <script type="application/json"> 또는 data-spec 등
  const scripts = document.querySelectorAll(
    'script[type="application/json"], script[data-spec]',
  );
  for (const script of scripts) {
    try {
      const text = script.textContent?.trim();
      if (text && (text.startsWith("{") || text.startsWith("["))) {
        const parsed = JSON.parse(text);
        if (parsed && (parsed.openapi || parsed.swagger || parsed.paths)) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  return null;
}
