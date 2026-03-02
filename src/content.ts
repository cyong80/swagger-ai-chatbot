/**
 * Content script: 페이지(MAIN world)의 postMessage를 수신해 확장에 전달
 * CustomEvent는 isolated world에서 수신 불가하므로 postMessage 사용
 * Swagger UI가 iframe 내에 있을 수 있어 e.source 검사 생략 (__swaggerAi로 식별)
 */
window.addEventListener("message", (e: MessageEvent) => {
  const data = e.data;

  if (!data || typeof data !== "object" || data.__swaggerAi !== true) return;
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return;
  if (data.type === "API_PICKED" && data.path && data.method) {
    chrome.runtime.sendMessage({
      type: "API_PICKED",
      path: data.path,
      method: data.method,
    });
  } else if (data.type === "API_PICKER_STARTED") {
    chrome.runtime.sendMessage({ type: "API_PICKER_STARTED" });
  }
});
