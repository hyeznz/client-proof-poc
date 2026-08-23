"use client";
import { useLayoutEffect, useRef } from "react";

// 메인 타이틀 3줄 blockFit (Photoshop "Justify All" 방식) — 원본 fitMainTitle 로직 복붙.
// 모든 줄을 배너 폭에 맞추되, 짧은 줄은 폰트 확대(캡) + 자간으로 채움.
const MAX_SIZE_RATIO = 1.8;

function fit(h1: HTMLElement, targetWidth: number) {
  const lines = Array.from(h1.querySelectorAll<HTMLElement>(".mt-line"));
  if (!lines.length || !targetWidth) return;
  const measures = lines.map((line) => {
    line.style.letterSpacing = "";
    line.style.fontSize = "100px";
    return { line, naturalWidth: line.offsetWidth, charCount: (line.textContent || "").length };
  });
  const baseFS = Math.min(...measures.map((m) => (targetWidth / m.naturalWidth) * 100));
  const maxFS = baseFS * MAX_SIZE_RATIO;
  measures.forEach((m) => {
    const idealFS = (targetWidth / m.naturalWidth) * 100;
    const actualFS = Math.min(idealFS, maxFS);
    m.line.style.fontSize = actualFS.toFixed(2) + "px";
    if (actualFS < idealFS - 0.5 && m.charCount > 1) {
      let ls = 0;
      m.line.style.letterSpacing = "0px";
      for (let i = 0; i < 5; i++) {
        const diff = targetWidth - m.line.offsetWidth;
        if (Math.abs(diff) < 0.5) break;
        ls += diff / m.charCount;
        m.line.style.letterSpacing = ls.toFixed(3) + "px";
      }
    }
  });
}

export default function MainTitle() {
  const ref = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const h1 = ref.current;
    if (!h1) return;
    const run = () => {
      const banner = document.querySelector<HTMLElement>(".banner-inner");
      if (banner) fit(h1, banner.clientWidth);
    };
    run();
    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(timer); timer = setTimeout(run, 80); };
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(run); // 폰트 파일 로드 후 재측정 (필수)
    return () => { window.removeEventListener("resize", onResize); clearTimeout(timer); };
  }, []);

  return (
    <div className="title-block">
      <h1 className="main-title" ref={ref}>
        <span className="mt-line">&lsquo;싸게하는 곳&rsquo;은 많아도</span>
        <span className="mt-line"><span className="mt-hi">&lsquo;제대로 캐리하는 곳&rsquo;</span>은</span>
        <span className="mt-line mt-line--tight">흔치 않아요</span>
      </h1>
    </div>
  );
}
