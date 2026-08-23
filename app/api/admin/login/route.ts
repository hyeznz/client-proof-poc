import { NextResponse } from "next/server";
import { setAdminSession } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const { password } = await request.json();
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "비밀번호가 틀렸어요." }, { status: 401 });
  }
  await setAdminSession();
  return NextResponse.json({ ok: true });
}
