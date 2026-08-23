"use client";
import { useRef } from "react";
import { typeLabel } from "@/lib/labels";
import type { Placed } from "@/lib/types";

type Props = {
  placed: Placed[];
  slideClass: string; // slide-out-left 등, ReviewPage가 전환 시퀀스 관리
  noAnim: boolean;
  onOpen: (id: number | string) => void;
  onSwipe: (dir: 1 | -1) => void;
};

export default function BentoGrid({ placed, slideClass, noAnim, onOpen, onSwipe }: Props) {
  // 좌우 스와이프 → 필터 전환 (원본 setupBentoSwipe 판정 기준 그대로)
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() } : null;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current; touch.current = null;
    if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x, dy = t.clientY - s.y, dt = Date.now() - s.t;
    if (dt > 600 || Math.abs(dy) > 50 || Math.abs(dx) < 60 || Math.abs(dx) <= Math.abs(dy) * 1.4) return;
    onSwipe(dx < 0 ? 1 : -1);
  };

  return (
    <section className="bento-section">
      <div
        className={["bento", slideClass, noAnim ? "no-anim" : ""].filter(Boolean).join(" ")}
        id="bento"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {placed.length === 0 && (
          <div style={{ gridColumn: "1/-1", padding: 60, textAlign: "center", fontSize: 13, opacity: 0.5, letterSpacing: "0.05em" }}>결과 없음</div>
        )}
        {placed.map((p, i) => {
          const r = p.review;
          const style = {
            gridColumn: p.col,
            gridRow: `${p.rowStart} / span ${p.rows}`,
            "--card-index": Math.min(i, 12),
          } as React.CSSProperties;
          return (
            <article
              key={r.id}
              className={`cell h-${p.h} v-${p.v}`}
              data-id={r.id}
              style={style}
              role="button"
              tabIndex={0}
              aria-label={`${r.title} — 후기 자세히 보기`}
              onClick={() => onOpen(r.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(r.id); } }}
            >
              <div className="cell-top">
                <span className="cell-sub">{typeLabel[r.type] || r.type}</span>
                <svg className="cell-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="8 7 17 7 17 16" />
                </svg>
              </div>
              <div className="cell-keyword">
                {r.titleLines.map((line, k) => <span className="kw-line" key={k}>{line}</span>)}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
