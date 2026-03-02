/**
 * Swagger UI / Redoc 페이지에서 API 클릭 선택
 * chrome.scripting.executeScript(world: "MAIN", func: startApiPicker)로 페이지에 주입
 * sandbox/제한된 컨텍스트에서 안전하게 early return
 */
export function startApiPicker(): void {
  try {
    if (!document.body || !document.head) return;
  } catch {
    return;
  }

  const Z = 2147483647;

  function findApiFromElement(
    el: Element | null,
  ): { path: string; method: string } | null {
    if (!el) return null;
    const opblock = el.closest(".opblock");
    if (opblock) {
      const methodEl = opblock.querySelector(".opblock-summary-method");
      const pathEl = opblock.querySelector(".opblock-summary-path");
      const method = methodEl?.textContent?.trim().toUpperCase() ?? "GET";
      const rawPath = pathEl?.textContent?.trim();
      // 제로폭 공백(U+200B) 등 invisible 문자 제거 후 경로 정규화
      const path = rawPath?.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
      if (path?.startsWith("/")) {
        return { path, method };
      }
    }
    const redocOp = el.closest("[data-path]");
    if (redocOp) {
      const rawPath = redocOp.getAttribute("data-path");
      const path = rawPath?.replace(/[\u200B-\u200D\uFEFF]/g, "").trim();
      const methodEl = redocOp.querySelector(
        ".opblock-summary-method, [class*='http']",
      );
      const method = methodEl?.textContent?.trim().toUpperCase() ?? "GET";
      if (path?.startsWith("/")) return { path, method };
    }
    return null;
  }

  let opblocks: NodeListOf<Element>;
  let style: HTMLStyleElement;
  let guideBox: HTMLDivElement;
  try {
    opblocks = document.querySelectorAll(".opblock, [data-path]");
  } catch {
    return;
  }
  if (opblocks.length === 0) return; // 이 프레임에 API 목록 없음

  try {
    style = document.createElement("style");
    style.id = "swagger-ai-picker-styles";
    style.textContent = `
    @keyframes swaggerAiPulse{0%,100%{opacity:1}50%{opacity:0.5}}
    .swagger-ai-pickable{cursor:pointer;transition:box-shadow .15s}
    .swagger-ai-pickable:hover{box-shadow:0 0 0 3px rgba(34,197,94,0.8)!important;outline:2px solid rgba(34,197,94,0.9);outline-offset:2px}
  `;
    document.head.appendChild(style);
    opblocks.forEach((el) => el.classList.add("swagger-ai-pickable"));
    guideBox = document.createElement("div");
    guideBox.id = "swagger-ai-picker-overlay";
    guideBox.innerHTML = `
    <div style="
      position:fixed;top:12px;left:50%;transform:translateX(-50%);
      z-index:${Z};background:linear-gradient(135deg,#1e293b,#0f172a);
      color:#f1f5f9;padding:16px 24px;border-radius:12px;
      font-size:14px;box-shadow:0 10px 40px rgba(0,0,0,0.4);
      pointer-events:none;max-width:90%;border:1px solid rgba(34,197,94,0.3);
    ">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <span style="width:10px;height:10px;background:#22c55e;border-radius:50%;animation:swaggerAiPulse 1s infinite"></span>
        <strong>API 선택 모드</strong>
      </div>
      <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5">
        <strong style="color:#22c55e">METHOD</strong>과 <strong style="color:#22c55e">Path</strong>가 표시된 
        API 행을 클릭하세요. 호버 시 녹색 테두리로 표시됩니다.
      </p>
      <p style="margin:6px 0 0;font-size:11px;color:#64748b">
        예: <code style="background:rgba(0,0,0,0.3);padding:2px 6px;border-radius:4px">GET /pet/findByStatus</code>
      </p>
    </div>
  `;
  } catch {
    return; // DOM 조작 불가 (sandbox 등)
  }

  function postMsg(payload: Record<string, unknown>): void {
    try {
      window.postMessage({ __swaggerAi: true, ...payload }, "*");
    } catch {
      /* sandbox/제한 컨텍스트에서 postMessage 불가 */
    }
  }

  function cleanup(): void {
    try {
      guideBox.remove();
    } catch {
      /* ignore */
    }
    try {
      style.remove();
    } catch {
      /* ignore */
    }
    opblocks.forEach((el) => {
      try {
        el.classList.remove("swagger-ai-pickable");
      } catch {
        /* ignore */
      }
    });
    document.removeEventListener("click", handler, true);
  }

  function handler(e: MouseEvent): void {
    const target = e.target as Element;
    const api = findApiFromElement(target);
    if (api) {
      postMsg({ type: "API_PICKED", path: api.path, method: api.method });
      cleanup();
    } else {
      cleanup();
    }
  }

  document.body.appendChild(guideBox);
  postMsg({ type: "API_PICKER_STARTED" });
  document.addEventListener("click", handler, true);
}
