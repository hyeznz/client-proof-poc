"use client";
import { useEffect, useRef } from "react";
import { typeLabel } from "@/lib/labels";
import { maskNickname } from "@/lib/mask";
import type { Review } from "@/lib/types";

type Props = { review: Review | null; onClose: () => void };

// 카드 클릭 시 뜨는 상세 시트. 핸들 드래그(터치/마우스)로 닫기.
export default function ReviewSheet({ review, onClose }: Props) {
  const sheet = useRef<HTMLElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const open = !!review;

  useEffect(() => {
    if (open && body.current) body.current.scrollTop = 0;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && open) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // 드래그 닫기 — 100px 이상 당기면 닫힘
  const drag = useRef({ startY: 0, cur: 0, on: false });
  const start = (y: number) => {
    drag.current = { startY: y, cur: 0, on: true };
    sheet.current?.classList.add("dragging");
    document.body.classList.add("sheet-dragging");
  };
  const move = (y: number) => {
    if (!drag.current.on || !sheet.current) return;
    drag.current.cur = Math.max(0, y - drag.current.startY);
    sheet.current.style.transform = `translateY(${drag.current.cur}px)`;
  };
  const end = () => {
    if (!drag.current.on || !sheet.current) return;
    drag.current.on = false;
    sheet.current.classList.remove("dragging");
    document.body.classList.remove("sheet-dragging");
    sheet.current.style.transform = "";
    if (drag.current.cur > 100) onClose();
  };
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    start(e.clientY);
    const mv = (ev: MouseEvent) => move(ev.clientY);
    const up = () => { end(); document.removeEventListener("mousemove", mv); document.removeEventListener("mouseup", up); };
    document.addEventListener("mousemove", mv);
    document.addEventListener("mouseup", up);
  };

  const paragraphs = review ? review.fullText.split(/\n\n+/).filter((p) => p.trim()) : [];

  return (
    <>
      <div className={"sheet-overlay" + (open ? " open" : "")} onClick={onClose} />
      <aside className={"sheet" + (open ? " open" : "")} ref={sheet} role="dialog" aria-modal="true" aria-hidden={!open}>
        <div
          className="sheet-handle"
          aria-label="드래그로 닫기"
          onTouchStart={(e) => start(e.touches[0].clientY)}
          onTouchMove={(e) => move(e.touches[0].clientY)}
          onTouchEnd={end}
          onMouseDown={onMouseDown}
        />
        <button className="sheet-close" aria-label="닫기" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" />
          </svg>
        </button>
        <div className="sheet-header">
          <div className="sheet-sub">{review ? typeLabel[review.type] || review.type : ""}</div>
          <div className="sheet-title">{review?.title ?? ""}</div>
        </div>
        <div className="sheet-body" ref={body}>
          {review && (
            <div className="sheet-meta">
              <span>
                {maskNickname(review.nickname).map((seg, i) => (
                  <span key={i}>{i > 0 && " "}{seg.head}<span className="mask">{seg.stars}</span></span>
                ))}
              </span>
              <span className="dot" />
              <span>{review.date}</span>
              <span className="dot" />
              <span>#{String(review.id).padStart(3, "0")}</span>
            </div>
          )}
          <div className="sheet-highlight" style={{ display: "none" }} />
          <div className="sheet-fulltext">
            {paragraphs.map((p, i) => {
              // [PHOTO:NN] 단독 문단 → 사진
              const m = p.trim().match(/^\[PHOTO:(\d+)\]$/);
              if (m) {
                const src = review!.photos[parseInt(m[1], 10) - 1];
                // eslint-disable-next-line @next/next/no-img-element
                return src ? <img key={i} className="review-photo" src={src} alt={`후기 사진 ${m[1]}`} loading="lazy" /> : null;
              }
              const lines = p.split("\n");
              return (
                <p key={i}>
                  {lines.map((l, k) => <span key={k}>{k > 0 && <br />}{l}</span>)}
                </p>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}
