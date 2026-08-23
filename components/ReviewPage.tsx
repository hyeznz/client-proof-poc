"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { layout } from "@/lib/bento";
import { selectForFilter } from "@/lib/filters";
import { FILTERS, type Filter } from "@/lib/labels";
import type { Review } from "@/lib/types";
import MainTitle from "./MainTitle";
import CalloutBanner from "./CalloutBanner";
import FilterTabs from "./FilterTabs";
import BentoGrid from "./BentoGrid";
import ReviewSheet from "./ReviewSheet";
import FloatingCTA from "./FloatingCTA";
import QuoteModal from "./QuoteModal";
import ReviewModal from "./ReviewModal";

type Props = { reviews: Review[]; version: string };

export default function ReviewPage({ reviews, version }: Props) {
  const [filter, setFilter] = useState<Filter>("하이라이트");
  const [openedId, setOpenedId] = useState<number | string | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [slideClass, setSlideClass] = useState("");
  const [noAnim, setNoAnim] = useState(false);
  const switching = useRef(false);

  const placed = useMemo(() => layout(selectForFilter(reviews, filter), filter), [reviews, filter]);
  const opened = openedId == null ? null : reviews.find((r) => r.id === openedId) ?? null;

  // 기존 CSS가 body 클래스(sheet-open/quote-open/review-open)로 CTA 페이드·스크롤 잠금 처리
  useEffect(() => {
    const b = document.body.classList;
    b.toggle("sheet-open", !!opened);
    b.toggle("quote-open", quoteOpen);
    b.toggle("review-open", reviewOpen);
  }, [opened, quoteOpen, reviewOpen]);

  // 필터 전환 슬라이드: OUT(280ms) → 교체 + 반대편 출발점 → 두 프레임 후 IN
  const switchFilter = useCallback((next: Filter, dir: 1 | -1) => {
    if (switching.current || next === filter) return;
    switching.current = true;
    const outClass = dir > 0 ? "slide-out-left" : "slide-out-right";
    const inStart = dir > 0 ? "slide-in-start-right" : "slide-in-start-left";
    setSlideClass(outClass);
    setTimeout(() => {
      setFilter(next);
      setNoAnim(true);
      setSlideClass(inStart);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setSlideClass("");
        setTimeout(() => { switching.current = false; }, 360);
      }));
    }, 280);
    // PC: 그리드 상단이 화면 위로 넘어갔으면 부드럽게 올림
    requestAnimationFrame(() => {
      const sec = document.querySelector(".bento-section");
      if (sec && sec.getBoundingClientRect().top < 0) sec.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [filter]);

  const onSwipe = (dir: 1 | -1) => {
    const i = FILTERS.indexOf(filter) + dir;
    if (i >= 0 && i < FILTERS.length) switchFilter(FILTERS[i], dir);
  };

  const closeSheet = useCallback(() => setOpenedId(null), []);
  const closeQuote = useCallback(() => setQuoteOpen(false), []);
  const closeReview = useCallback(() => setReviewOpen(false), []);

  return (
    <>
      <div className="topline-wrap"><div className="topline" /></div>

      <MainTitle />

      <CalloutBanner />

      <FilterTabs active={filter} onChange={switchFilter} />
      <BentoGrid placed={placed} slideClass={slideClass} noAnim={noAnim} onOpen={setOpenedId} onSwipe={onSwipe} />

      <div className="bottomline" />
      {/* VERSION_TAG: package.json version → V07W01 */}
      <div className="footer-info mono">
        <span>MOVING CARRY CO. — REVIEW PAGE / {version}</span>
        <span>VERIFIED BY 강봉원 CAFE</span>
      </div>

      <ReviewSheet review={opened} onClose={closeSheet} />
      <FloatingCTA onReview={() => setReviewOpen(true)} onQuote={() => setQuoteOpen(true)} />
      <QuoteModal open={quoteOpen} onClose={closeQuote} />
      <ReviewModal open={reviewOpen} onClose={closeReview} />
    </>
  );
}
