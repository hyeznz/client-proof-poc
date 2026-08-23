import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import ReviewRow from "@/components/admin/ReviewRow";
import LogoutButton from "@/components/admin/LogoutButton";

export type AdminReview = {
  id: string;
  created_at: string;
  move_date: string | null;
  type: string | null;
  rating: number | null;
  content: string;
  nickname: string;
  phone: string;
  photos: string[];
  status: "pending" | "published" | "rejected";
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  const status = (await searchParams).status ?? "pending";
  const { data, error } = await createAdminClient()
    .from("reviews")
    .select("id, created_at, move_date, type, rating, content, nickname, phone, photos, status")
    .eq("status", status)
    .order("created_at", { ascending: false });

  const reviews = (data ?? []) as AdminReview[];

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 80px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 20 }}>후기 관리</h1>
        <LogoutButton />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["pending", "published", "rejected"] as const).map((s) => (
          <a
            key={s}
            href={`/admin?status=${s}`}
            style={{
              padding: "6px 12px", borderRadius: 999, fontSize: 13, textDecoration: "none",
              background: s === status ? "#111" : "#eee", color: s === status ? "#fff" : "#333",
            }}
          >
            {{ pending: "대기중", published: "게재됨", rejected: "반려됨" }[s]}
          </a>
        ))}
      </div>

      {error && <p style={{ color: "#d33" }}>불러오기 실패: {error.message}</p>}
      {!error && reviews.length === 0 && <p style={{ color: "#888", fontSize: 14 }}>해당 상태의 후기가 없어요.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {reviews.map((r) => (
          <ReviewRow key={r.id} review={r} />
        ))}
      </div>
    </main>
  );
}
