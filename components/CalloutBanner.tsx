"use client";
import { useEffect, useRef, useState } from "react";

// 콜아웃 오렌지 박스 — 챕터별로 구간 순차 등장 → 유지 → 페이드아웃 → 다음 챕터 → 루프.
// 화면에 보일 때만 재생. prefers-reduced-motion이면 CSS가 애니메이션 제거.
// 타이밍은 globals.css `.co-body` 의 --co-* 변수.
// { text, em, para } — em: 강조(볼드), para: 새 문단 시작(위 간격 넓게). 텍스트 안 「」 는 볼드.
const CHAPTERS: { text: string; em?: boolean; para?: boolean }[][] = [
  [
    { text: "아래의 후기들은" },
    { text: "실제 저희와 이사를 마친 고객님들께서" },
    { text: "직접 남긴 이야기입니다." },
  ],
  [
    { text: "이사 업계에서" },
    { text: "「“다음에도 꼭 여기서”」라는 말은" },
    { text: "흔하지 않습니다.", em: true },
  ],
  [
    { text: "다음 이사 때 다시 부르고," },
    { text: "주변에 소개까지 하는 이유," },
    { text: "직접 경험해보세요.", em: true },
  ],
];

function renderText(t: string) {
  return t.split(/「|」/).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part));
}

export default function CalloutBanner() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0); // step % 챕터수 = 현재 챕터. 증가 = 애니메이션 재시작
  const chapter = step % CHAPTERS.length;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="banner" ref={ref}>
      <div className="banner-inner co-stack">
        {/* 모든 챕터를 같은 칸에 겹쳐 렌더 → 박스 높이가 가장 긴 챕터로 고정 (챕터 전환 시 점프 방지) */}
        {CHAPTERS.map((segs, ci) => {
          const active = ci === chapter;
          return (
            <div
              key={active ? `c${ci}-${step}` : `c${ci}`}
              className={"banner-body co-body" + (active && visible ? " co-play" : "") + (active ? "" : " co-hidden")}
              style={{ "--co-count": segs.length } as React.CSSProperties}
              onAnimationEnd={(e) => { if (active && e.target === e.currentTarget) setStep((s) => s + 1); }}
            >
              {segs.map((seg, i) => (
                <span className={"co-seg" + (seg.em ? " co-em" : "") + (seg.para ? " co-para" : "")} key={i} style={{ "--i": i } as React.CSSProperties}>
                  <span className="co-inner">{seg.em ? <strong>{seg.text}</strong> : renderText(seg.text)}</span>
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
