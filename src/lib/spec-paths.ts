/**
 * OpenAPI 스펙에서 경로 목록 추출 및 슬래시 자동완성용 필터링
 */

function getPathsFromSpec(spec: unknown): string[] {
  if (!spec || typeof spec !== "object") return [];
  const paths = (spec as { paths?: Record<string, unknown> }).paths;
  if (!paths || typeof paths !== "object") return [];
  return Object.keys(paths).filter((p) => typeof p === "string" && p.startsWith("/"));
}

/**
 * 입력된 쿼리에 맞는 경로 목록 반환 (최대 limit개)
 * 쿼리는 "/" 이후 텍스트로, 대소문자 구분 없이 포함 여부로 필터링
 */
export function filterPathsByQuery(
  spec: unknown,
  query: string,
  limit = 10
): string[] {
  const paths = getPathsFromSpec(spec);
  const q = query.trim().toLowerCase();
  if (!q) return paths.slice(0, limit);
  const matched = paths.filter((p) => p.toLowerCase().includes(q));
  return matched.slice(0, limit);
}
