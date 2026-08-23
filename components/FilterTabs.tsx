"use client";
import { useEffect, useRef } from "react";
import { FILTERS, type Filter } from "@/lib/labels";

type Props = { active: Filter; onChange: (f: Filter, dir: 1 | -1) => void };

// 언더라인 탭 — 선택된 글자 밑으로 인디케이터 슬라이드 + 선택 탭 중앙 스크롤
export default function FilterTabs({ active, onChange }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const first = useRef(true);

  useEffect(() => {
    const c = container.current, ind = indicator.current;
    if (!c || !ind) return;
    const chip = c.querySelector<HTMLElement>(".chip.active");
    if (!chip) return;
    const update = (animate: boolean) => {
      const label = chip.querySelector(".chip-label") || chip;
      const cr = c.getBoundingClientRect(), lr = label.getBoundingClientRect();
      const left = lr.left - cr.left + c.scrollLeft;
      if (!animate) {
        ind.style.transition = "none";
        requestAnimationFrame(() => { ind.style.transition = ""; });
      }
      ind.style.transform = `translateX(${left}px)`;
      ind.style.width = `${lr.width}px`;
    };
    update(!first.current);
    if (!first.current) {
      const cr = c.getBoundingClientRect(), chr = chip.getBoundingClientRect();
      c.scrollTo({ left: c.scrollLeft + (chr.left + chr.width / 2) - (cr.left + cr.width / 2), behavior: "smooth" });
    }
    first.current = false;
    const onResize = () => update(false);
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(() => update(false)); // 점프체 스왑 후 글자 폭 변동 반영
    return () => window.removeEventListener("resize", onResize);
  }, [active]);

  return (
    <div className="filter-bar">
      <div className="type-chips" id="type-chips" ref={container}>
        {FILTERS.map((f) => (
          <button
            key={f}
            className={"chip" + (f === active ? " active" : "")}
            data-type={f}
            onClick={() => {
              const cur = FILTERS.indexOf(active), next = FILTERS.indexOf(f);
              onChange(f, next >= cur ? 1 : -1);
            }}
          >
            <span className="chip-label">{f}</span>
          </button>
        ))}
        <span className="tab-indicator" ref={indicator} aria-hidden="true" />
      </div>
    </div>
  );
}
