# Swagger AI Assistant

Chrome 확장 프로그램으로, Swagger UI 또는 Redoc 기반 API 문서 페이지에서 OpenAPI 스펙을 추출하고 LLM과 대화하며 API에 대해 질문할 수 있는 사이드 패널 챗봇입니다.

## 주요 기능

- **API 문서 기반 AI 채팅**: 현재 탭에 열린 Swagger UI / Redoc 페이지의 OpenAPI 스펙을 자동 추출하여 맥락으로 사용
- **다중 LLM 지원**: Gemini, OpenAI(GPT-4o-mini), Claude 중 선택 가능
- **API 클릭 선택**: 문서 내 API 엔드포인트를 클릭하면 해당 API 설명과 TypeScript DTO 생성 요청을 자동으로 채팅에 전송
- **경로 자동완성**: `/` 입력 시 스펙에서 추출한 API 경로 목록을 제안 (슬래시 자동완성)
- **다크/라이트 테마**: 시스템 설정 또는 수동 토글 지원

## 기술 스택

| 구분 | 기술 |
|------|------|
| 런타임 | React 19, TypeScript |
| 빌드 | Vite 7, @crxjs/vite-plugin |
| 스타일링 | Tailwind CSS 4 |
| UI 컴포넌트 | shadcn/ui (Radix UI), Lucide Icons |
| 패키지 매니저 | bun (권장) / yarn |
| 확장 플랫폼 | Chrome Extension (Manifest V3, Side Panel) |

## 프로젝트 구조

```
src/
├── main.tsx                 # React 진입점
├── App.tsx                  # 앱 루트 (탭/채팅/설정 조율)
├── manifest.json            # Chrome 확장 매니페스트
├── content.ts               # Content script (postMessage relay)
├── background.ts            # Service worker (Side Panel 설정)
│
├── screens/
│   ├── ChatScreen.tsx       # 채팅 UI (메시지 목록, 입력, API 선택 버튼)
│   └── SettingsScreen.tsx   # 설정 화면 (Provider, API 키, Max Tokens)
│
├── components/
│   ├── ChatInput.tsx        # 입력창 + / 경로 자동완성
│   ├── MessageContent.tsx   # 마크다운/코드블록 렌더링
│   ├── mode-toggle.tsx      # 테마 토글
│   ├── theme-provider.tsx   # 테마 Context
│   └── ui/                  # shadcn 기반 UI
│
├── hooks/
│   ├── useSettings.ts       # 설정 로드/저장
│   ├── useSpec.ts           # OpenAPI 스펙 추출
│   ├── useChat.ts           # 채팅 상태 및 LLM 호출
│   └── useApiPicker.ts       # API 클릭 선택 모드
│
└── lib/
    ├── types.ts             # 공통 타입, 서비스 인터페이스
    ├── ai.ts                # LLM 호출 (어댑터 기반)
    ├── api-prompt.ts        # API 설명 + DTO 요청 프롬프트 생성
    ├── api-picker.ts        # 페이지에 API 선택 모드 주입 (DOM 조작)
    ├── spec-extractor.ts    # Swagger UI / Redoc에서 스펙 추출
    ├── spec-paths.ts        # 스펙 경로 목록 추출 및 자동완성 필터링
    ├── security.ts          # API 키 암호화/복호화 (호환 레이어)
    ├── utils.ts             # cn() 등 유틸
    ├── adapters/            # LLM Provider 어댑터 (OCP)
    │   ├── index.ts
    │   ├── gemini-adapter.ts
    │   ├── openai-adapter.ts
    │   └── claude-adapter.ts
    └── services/            # 의존성 역전용 서비스 구현체 (DIP)
        ├── storage-service.ts
        ├── tab-service.ts
        └── encryption-service.ts
```

## 동작 방식

1. **스펙 추출**: Swagger UI(`window.ui.specSelectors.specJson`) 또는 Redoc(`window.redocStore.spec`), 또는 `<script type="application/json">` 등에서 OpenAPI 스펙을 추출합니다.
2. **채팅**: 사용자 입력 + 스펙 컨텍스트를 LLM에 전송하여 API 전문가 역할의 응답을 받습니다.
3. **API 선택**: API Picker 버튼 클릭 시 페이지에 선택 모드를 주입하고, 사용자가 문서에서 API를 클릭하면 해당 path/method로 프롬프트를 생성해 채팅에 전송합니다.
4. **Content Script**: 페이지(MAIN world)의 `postMessage`를 수신해 확장에 전달합니다. (iframe 내 Swagger UI 대응)

## 설치 및 실행

### 사전 요구사항

- Node.js 18+
- bun 또는 yarn

### 의존성 설치

```bash
bun install
# 또는
yarn install
```

### 개발 모드

```bash
bun run dev
# 또는
yarn dev
```

개발 서버 실행 후 Chrome에서 `chrome://extensions` → "압축해제된 확장 프로그램 로드" → `dist` 폴더 선택합니다.

### 프로덕션 빌드

```bash
bun run build
# 또는
yarn build
```

`dist/` 폴더에 빌드 결과가 생성됩니다. Chrome 확장 프로그램으로 `dist` 폴더를 로드합니다.

## 사용 방법

1. Chrome에서 Swagger UI 또는 Redoc 페이지를 엽니다.
2. 확장 프로그램 아이콘을 클릭하거나 사이드 패널에서 Swagger AI Assistant를 엽니다.
3. **Settings** 탭에서 LLM Provider(Gemini/OpenAI/Claude)와 API 키를 설정합니다.
4. **Chat** 탭으로 돌아와 API에 대해 질문합니다.
5. **API 선택 버튼**(마우스 아이콘)을 누르면 문서에서 API를 클릭해 선택할 수 있습니다.
6. 입력창에서 `/`를 입력하면 API 경로 자동완성이 나타납니다.

## 빌드 스크립트

| 스크립트 | 설명 |
|----------|------|
| `dev` | Vite 개발 서버 실행 (HMR) |
| `build` | TypeScript 컴파일 + Vite 프로덕션 빌드 |
| `lint` | ESLint 실행 |
| `preview` | 빌드 결과 미리보기 |

## 아키텍처 설계 (SOLID)

- **SRP**: `useSettings`, `useSpec`, `useChat`, `useApiPicker` 등 역할별 훅/서비스 분리
- **OCP**: LLM Provider 어댑터 패턴으로 새 프로바이더 추가 시 기존 코드 수정 없이 확장 가능
- **DIP**: `IStorageService`, `ITabService`, `ILLMAdapter`, `IEncryptionService` 등 인터페이스에 의존, 테스트 시 mock 주입 가능

## 라이선스

Private
