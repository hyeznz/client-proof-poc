import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

type Body =
  | { action: "publish"; mainTag: string; title: string; titleLines: string[]; impact: number }
  | { action: "reject" };

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = (await request.json()) as Body;

  const update =
    body.action === "publish"
      ? {
          status: "published",
          main_tag: body.mainTag,
          tags: [body.mainTag], // MVP: 단일 mainTag를 그대로 tags에도 반영 (하이라이트 쇼케이스 판정용)
          title: body.title,
          title_lines: body.titleLines,
          impact: body.impact,
        }
      : { status: "rejected" };

  const { error } = await createAdminClient().from("reviews").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
