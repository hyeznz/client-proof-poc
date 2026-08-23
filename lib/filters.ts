// 필터별 후기 선별 — 원본 getArrangementForFilter 1~2단계 복붙. 배치는 bento.ts 담당.
import { mainTagOrder, mainTagToFilter, stackConfig, type Filter } from "./labels";
import type { Review } from "./types";

const sourceRank: Record<string, number> = { best: 0, sub: 1 };

// impact(DESC) > source > mainTagOrder > id(DESC)
function sortFn(a: Review, b: Review) {
  const ia = a.impact ?? 50, ib = b.impact ?? 50;
  if (ib !== ia) return ib - ia;
  const s = (sourceRank[a.source] ?? 2) - (sourceRank[b.source] ?? 2);
  if (s !== 0) return s;
  const ai = mainTagOrder.indexOf(a.mainTag), bi = mainTagOrder.indexOf(b.mainTag);
  const ma = ai === -1 ? 999 : ai, mb = bi === -1 ? 999 : bi;
  if (ma !== mb) return ma - mb;
  return String(b.id).localeCompare(String(a.id)); // 결정적 타이브레이커 (id 타입 혼재 허용)
}

export function selectForFilter(all: Review[], filter: Filter): Review[] {
  const base =
    filter === "하이라이트"
      ? all.filter((r) => r.tags.includes("하이라이트")) // 쇼케이스 탭 — tag 기반
      : all.filter((r) => mainTagToFilter[r.mainTag] === filter);
  base.sort(sortFn);

  const cfg = stackConfig[filter];
  if (!cfg) return base;
  const baseIds = new Set(base.map((r) => r.id));
  const stack = all
    .filter((r) => !baseIds.has(r.id) && r.tags.some((t) => cfg.tags.includes(t)))
    .sort(sortFn)
    .slice(0, cfg.max);
  return [...base, ...stack];
}
