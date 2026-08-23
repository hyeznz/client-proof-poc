// ============ 벽돌 벤토 배치 (v07) ============
// 원리: 카드를 impact 순으로 꺼내 "짧은 열"에 붙인다. 그때 두 열의 누적 높이가
// 같아지는 높이는 후보에서 뺀다 → 좌우 경계선이 같은 줄에서 만나는 십자(+)가
// 확률이 아니라 규칙으로 차단된다. 300회 셔플·벌점 함수 없음. 순수 함수, DOM 없음.
import { hashSeed, mulberry32, weightedPick } from "./rng";
import type { Color, Height, Placed, Review } from "./types";

export const HEIGHT_ROWS: Record<Height, number> = { xs: 3, s: 4, m: 5, l: 7, xl: 9 }; // 기존 CSS span 값
const HEIGHTS: readonly Height[] = ["xs", "s", "m", "l", "xl"];
const COLORS: readonly Color[] = ["light", "dark", "orange", "black"];

// 튜닝 상수 — 비율만 바꾸면 분포가 바뀜 (기존 bentoPool 20장 비율 그대로)
const HEIGHT_WEIGHTS: Record<Height, number> = { xs: 3, s: 6, m: 6, l: 3, xl: 2 };
const COLOR_WEIGHTS: Record<Color, number> = { light: 13, dark: 4, orange: 3, black: 1 };
// 제목 줄 수 → 최소 높이 (글자 잘림 방지)
const MIN_H_BY_LINES: Record<number, Height> = { 1: "xs", 2: "xs", 3: "s", 4: "m" };
const ORANGE_WITHIN_FIRST = 4; // 첫 화면(스크롤 전)에 포인트컬러 보장

function minHeight(r: Review): Height {
  const n = Math.min(r.titleLines.length, 4);
  return MIN_H_BY_LINES[n] ?? "m";
}

export function layout(reviews: Review[], seedKey: string): Placed[] {
  const rng = mulberry32(hashSeed(seedKey)());
  const placed: Placed[] = [];
  const top: Record<1 | 2, number> = { 1: 0, 2: 0 }; // 열별 누적 행 수

  for (const review of reviews) {
    const col: 1 | 2 = top[1] <= top[2] ? 1 : 2;
    const other: 1 | 2 = col === 1 ? 2 : 1;
    const start = top[col];

    // 높이 후보: 최소 높이 이상 && 붙인 뒤 반대 열 끝과 같아지지 않음 (벽돌 규칙)
    const minRows = HEIGHT_ROWS[minHeight(review)];
    let candidates = HEIGHTS.filter(
      (h) => HEIGHT_ROWS[h] >= minRows && start + HEIGHT_ROWS[h] !== top[other],
    );
    if (!candidates.length) candidates = [minHeight(review)]; // 불가피: 규칙 포기
    const h = weightedPick(candidates, HEIGHT_WEIGHTS, rng);
    const rows = HEIGHT_ROWS[h];

    // 색 후보: 바로 위 카드 색 제외 + 옆 열에서 세로로 겹치는 카드의 강조색 제외
    const forbidden = new Set<Color>();
    const above = placed.filter((p) => p.col === col).at(-1);
    if (above) forbidden.add(above.v);
    for (const p of placed) {
      if (p.col !== other || p.v === "light") continue;
      const pStart = p.rowStart - 1, pEnd = pStart + p.rows;
      if (pStart < start + rows && start < pEnd) forbidden.add(p.v);
    }
    let colorPool = COLORS.filter((c) => !forbidden.has(c));
    if (!colorPool.length) colorPool = ["light"];
    const v = weightedPick(colorPool, COLOR_WEIGHTS, rng);

    placed.push({ review, col, rowStart: start + 1, rows, h, v });
    top[col] = start + rows;
  }

  // above-the-fold: 첫 N장 안에 orange 없으면 N번째를 orange로
  const head = placed.slice(0, ORANGE_WITHIN_FIRST);
  if (head.length && !head.some((p) => p.v === "orange")) head[head.length - 1].v = "orange";

  return placed;
}
