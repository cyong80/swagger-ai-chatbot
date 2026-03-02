// src/background.ts
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// 모델별 CORS 이슈 방지를 위한 Proxy 로직을 여기에 추가할 수 있습니다.
