export type Review = {
  id: number | string; // 큐레이션 후기=number, Supabase 신규 승인 후기=uuid(string)
  source: string;
  nickname: string;
  date: string;
  type: string;
  mainTag: string;
  tags: string[];
  title: string;        // 시트 제목 (원문)
  titleLines: string[]; // 카드 제목 줄 단위 (titleBreaks 기반, 일부 축약)
  impact: number;
  fullText: string;
  photos: string[];
};

export type Height = "xs" | "s" | "m" | "l" | "xl";
export type Color = "light" | "dark" | "orange" | "black";

export type Placed = {
  review: Review;
  col: 1 | 2;
  rowStart: number; // 1-based grid row
  rows: number;
  h: Height;
  v: Color;
};
