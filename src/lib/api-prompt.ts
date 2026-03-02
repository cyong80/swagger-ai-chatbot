/**
 * 선택된 API 정보로 설명 + TypeScript DTO 생성 요청 프롬프트 빌드
 */

type OpenAPISpec = {
  paths?: Record<
    string,
    Record<
      string,
      {
        summary?: string;
        description?: string;
        parameters?: unknown[];
        requestBody?: unknown;
        responses?: Record<string, { content?: Record<string, { schema?: unknown }> }>;
      }
    >
  >;
  components?: { schemas?: Record<string, unknown> };
};

function getOperation(
  spec: unknown,
  path: string,
  method: string
): Record<string, unknown> | null {
  const s = spec as OpenAPISpec;
  if (!s?.paths?.[path]) return null;
  const pathItem = s.paths[path];
  const methodKey = method.toLowerCase();
  const op = pathItem[methodKey];
  return op ? (op as Record<string, unknown>) : null;
}

/**
 * API path, method, operation 정보를 담은 프롬프트 생성
 */
export function buildApiPrompt(
  spec: unknown,
  path: string,
  method: string
): string {
  const op = getOperation(spec, path, method);
  if (!op) {
    return `다음 API에 대해 설명해주고, Request/Response에 사용되는 TypeScript DTO(interface)를 생성해주세요.
DTO의 JSDoc/주석은 반드시 한글로 작성해주세요.

- Method: ${method}
- Path: ${path}

(스펙에서 상세 정보를 찾을 수 없습니다. 전체 스펙을 참고하여 답변해주세요.)`;
  }

  const summary = (op.summary as string) ?? "";
  const description = (op.description as string) ?? "";
  const parameters = op.parameters as unknown[] | undefined;
  const requestBody = op.requestBody as { content?: Record<string, { schema?: unknown }> } | undefined;
  const responses = op.responses as Record<string, { content?: Record<string, { schema?: unknown }> }> | undefined;

  const parts: string[] = [
    "다음 API에 대해 설명해주고, Request/Response에 사용되는 TypeScript DTO(interface)를 생성해주세요.",
    "DTO의 JSDoc/주석은 반드시 한글로 작성해주세요.",
    "",
    "## API 정보",
    `- **Method**: ${method}`,
    `- **Path**: ${path}`,
  ];

  if (summary) parts.push(`- **Summary**: ${summary}`);
  if (description) parts.push(`- **Description**: ${description}`);
  parts.push("");

  if (parameters?.length) {
    parts.push("## Parameters");
    parts.push(JSON.stringify(parameters, null, 2));
    parts.push("");
  }

  if (requestBody?.content) {
    const contentType = Object.keys(requestBody.content)[0];
    const schema = requestBody.content[contentType]?.schema;
    if (schema) {
      parts.push("## Request Body Schema");
      parts.push(JSON.stringify(schema, null, 2));
      parts.push("");
    }
  }

  if (responses && Object.keys(responses).length) {
    const successRes = responses["200"] ?? responses["201"] ?? responses["204"] ?? Object.values(responses)[0];
    if (successRes?.content) {
      const ct = Object.keys(successRes.content)[0];
      const schema = successRes.content[ct]?.schema;
      if (schema) {
        parts.push("## Response Schema");
        parts.push(JSON.stringify(schema, null, 2));
      }
    }
  }

  parts.push("");
  parts.push("위 정보를 바탕으로 API 설명과 함께 TypeScript DTO를 생성해주세요. DTO 주석은 한글로 작성해주세요.");

  return parts.join("\n");
}
