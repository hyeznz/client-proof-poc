import "server-only";

// 메모리 기반 속도 제한. Vercel 서버리스라 인스턴스별·재시작 시 리셋됨 — 단순 봇/실수 연타 방어용.
// ponytail: 진짜 분산 제한이 필요해지면 Upstash Redis 로 교체. 유료 API 최종 안전벨트는 Solapi 일일 한도(50건).
const buckets = new Map<string, number[]>();

/** key 별로 windowMs 안에 max 회 초과 시 false */
export function allow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) { buckets.set(key, hits); return false; }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) buckets.clear(); // 메모리 상한
  return true;
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}
