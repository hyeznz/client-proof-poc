// 원본 HTML 매핑 복붙 (v04w29 7탭 구조)
export const FILTERS = ["하이라이트", "유형별이사", "실력의차이", "고난도돌파", "정성하드캐리", "가격", "재이사맛집"] as const;
export type Filter = (typeof FILTERS)[number];

// 작은 키워드 (카드 좌상단 — 이사 타입)
export const typeLabel: Record<string, string> = {
  일반포장: "일반 포장이사",
  보관이사: "보관이사",
  신혼: "신혼 첫이사",
  부모님: "부모님 이사",
  원룸: "원룸 이사",
  장거리: "장거리 이사",
  재이용: "재이용 고객",
};

// 메인태그 순서 (한 필터 내 그룹 정렬용)
export const mainTagOrder = ["실력의차이", "유형별이사", "고난도돌파", "책임감", "친절응대", "정리정돈", "가격", "속전속결", "재이사맛집", "하이라이트"];

// 필터 단일 귀속 — 각 카드는 mainTag 기준 '단 하나의 탭'에만 기본 노출
export const mainTagToFilter: Record<string, Filter> = {
  하이라이트: "하이라이트",
  유형별이사: "유형별이사",
  실력의차이: "실력의차이",
  속전속결: "실력의차이",
  고난도돌파: "고난도돌파",
  책임감: "정성하드캐리",
  친절응대: "정성하드캐리",
  정리정돈: "정성하드캐리",
  가격: "가격",
  재이사맛집: "재이사맛집",
};

// 스택 정책 — 기본 카드가 적은 탭 하단에 tags 기준 보조 카드를 덧붙임
export const stackConfig: Partial<Record<Filter, { tags: string[]; max: number }>> = {
  가격: { tags: ["가격"], max: 15 },
  재이사맛집: { tags: ["재이사맛집"], max: 15 },
};
