import { createBrowserClient } from "./client";
import type { Review } from "@/lib/types";

// 관리자가 게재 승인한 신규 후기를 가져와 기존 큐레이션 78건과 같은 모양(Review)으로 맞춤.
// publishable key로 조회 — RLS가 status='published'만 노출하므로 서버에서 호출해도 안전.
export async function fetchPublishedReviews(): Promise<Review[]> {
  const { data, error } = await createBrowserClient()
    .from("reviews")
    .select("id, move_date, type, main_tag, tags, title, title_lines, impact, content, nickname, photos")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((r) => ({
    id: r.id as string,
    source: "site",
    nickname: r.nickname,
    date: r.move_date ?? "",
    type: r.type ?? "",
    mainTag: r.main_tag ?? "",
    tags: r.tags ?? [],
    title: r.title ?? "",
    titleLines: r.title_lines?.length ? r.title_lines : [r.title ?? ""],
    impact: r.impact ?? 50,
    fullText: r.content,
    photos: r.photos ?? [],
  }));
}
