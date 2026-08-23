"use client";
type Props = { onReview: () => void; onQuote: () => void };

// 우하단 원형 CTA 스택 (위: 후기작성, 아래: 견적신청). 모달 열리면 CSS(body 클래스)가 페이드아웃.
export default function FloatingCTA({ onReview, onQuote }: Props) {
  return (
    <div className="cta-stack">
      <button className="cta-float cta-review" aria-label="후기 작성하기" onClick={onReview}>
        <span className="cta-text">후기<br />작성</span>
      </button>
      <button className="cta-float cta-quote" aria-label="무료견적 신청" onClick={onQuote}>
        <span className="cta-text">무료견적<br /><span className="cta-apply">신청</span></span>
      </button>
    </div>
  );
}
