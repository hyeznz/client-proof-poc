import { describe, expect, it } from "vitest";
import reviews from "../data/reviews.json";
import { layout, HEIGHT_ROWS } from "./bento";
import type { Review } from "./types";

const all = reviews as Review[];
const FILTERS = ["하이라이트", "유형별이사", "실력의차이", "고난도돌파", "정성하드캐리", "가격", "재이사맛집"];

// 열별 경계선 집합을 모아 교집합 검사 (시작 0과 마지막 끝은 제외)
function crossings(placed: ReturnType<typeof layout>) {
  const ends = { 1: new Set<number>(), 2: new Set<number>() };
  let maxEnd = 0;
  for (const p of placed) {
    const end = p.rowStart - 1 + p.rows;
    ends[p.col].add(end);
    maxEnd = Math.max(maxEnd, end);
  }
  return [...ends[1]].filter((e) => ends[2].has(e) && e !== maxEnd);
}

describe("bento layout (벽돌)", () => {
  it("좌우 경계선이 같은 높이에서 만나지 않는다 (마지막 끝 제외)", () => {
    for (const f of FILTERS) {
      for (let n = 1; n <= all.length; n++) {
        expect(crossings(layout(all.slice(0, n), f)), `${f}/${n}`).toEqual([]);
      }
    }
  });

  it("같은 입력이면 같은 출력 (결정성)", () => {
    expect(layout(all, "하이라이트")).toEqual(layout(all, "하이라이트"));
    expect(layout(all, "가격")).not.toEqual(layout(all, "하이라이트"));
  });

  it("제목 4줄 후기는 m 이상", () => {
    for (const p of layout(all, "x")) {
      if (p.review.titleLines.length >= 4) expect(HEIGHT_ROWS[p.h]).toBeGreaterThanOrEqual(HEIGHT_ROWS.m);
    }
  });

  it("첫 4장 안에 orange 1개 이상", () => {
    for (const f of FILTERS) {
      const first4 = layout(all, f).slice(0, 4);
      expect(first4.some((p) => p.v === "orange"), f).toBe(true);
    }
  });

  it("카드가 겹치지 않고 열 안에서 연속 배치된다", () => {
    const placed = layout(all, "하이라이트");
    for (const col of [1, 2] as const) {
      const cards = placed.filter((p) => p.col === col).sort((a, b) => a.rowStart - b.rowStart);
      let cursor = 1;
      for (const c of cards) {
        expect(c.rowStart).toBe(cursor);
        cursor += c.rows;
      }
    }
  });
});
