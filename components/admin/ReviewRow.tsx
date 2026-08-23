"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { mainTagOrder } from "@/lib/labels";
import type { AdminReview } from "@/app/admin/page";

// [PHOTO:N] 자리표시자를 실제 사진으로 치환해 관리자가 본문 흐름 그대로 미리보기
function renderContent(content: string, photos: string[]) {
  return content.split("\n").map((line, i) => {
    const m = line.trim().match(/^\[PHOTO:(\d+)\]$/);
    if (m) {
      const src = photos[parseInt(m[1], 10) - 1];
      // eslint-disable-next-line @next/next/no-img-element
      return src ? <img key={i} src={src} alt="" style={{ maxWidth: 220, borderRadius: 8, display: "block", margin: "6px 0" }} /> : null;
    }
    return line ? <p key={i} style={{ margin: "4px 0" }}>{line}</p> : null;
  });
}

export default function ReviewRow({ review: r }: { review: AdminReview }) {
  const router = useRouter();
  const [mainTag, setMainTag] = useState(mainTagOrder[0]);
  const [title, setTitle] = useState("");
  const [impact, setImpact] = useState(50);
  const [busy, setBusy] = useState(false);

  const act = async (body: object) => {
    setBusy(true);
    const res = await fetch(`/api/admin/reviews/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) { alert("처리 중 문제가 생겼어요."); return; }
    router.refresh();
  };

  const publish = () => {
    if (!title.trim()) { alert("카드 제목을 입력해주세요."); return; }
    act({ action: "publish", mainTag, title: title.trim(), titleLines: title.split("\n").filter(Boolean), impact });
  };

  return (
    <div style={{ border: "1px solid #e2e2e2", borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#888", marginBottom: 8 }}>
        <span>{r.nickname} · {r.type ?? "-"} · ★{r.rating ?? "-"} · {r.move_date ?? "-"}</span>
        <span>{r.phone}</span>
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>{renderContent(r.content, r.photos)}</div>

      {r.status === "pending" && (
        <div style={{ borderTop: "1px solid #eee", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select value={mainTag} onChange={(e) => setMainTag(e.target.value)} style={{ padding: "6px 8px", fontSize: 13 }}>
              {mainTagOrder.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input
              type="number" min={1} max={99} value={impact}
              onChange={(e) => setImpact(Number(e.target.value))}
              title="impact (1~99, 정렬 우선순위)"
              style={{ width: 60, padding: "6px 8px", fontSize: 13 }}
            />
          </div>
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={"카드 제목 (줄바꿈으로 2~4줄로 나눠주세요)\n예: 냉장고 AS까지,\n한 시간 달려옴"}
            rows={3}
            style={{ padding: "8px", fontSize: 13, fontFamily: "inherit" }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={publish} disabled={busy} style={{ flex: 1, padding: "8px", background: "#111", color: "#fff", border: "none", borderRadius: 6 }}>
              게재
            </button>
            <button onClick={() => act({ action: "reject" })} disabled={busy} style={{ padding: "8px 16px", background: "#eee", border: "none", borderRadius: 6 }}>
              반려
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
