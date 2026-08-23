import { NextResponse } from "next/server";
import { sendSms } from "@/lib/solapi";

// 견적 접수: ① Apps Script(구글 시트)로 전달 ② 고객 폰으로 접수 안내 문자.
// 브라우저가 Apps Script를 직접 치던 걸 서버로 옮김 → URL이 클라이언트에 안 노출되고 응답도 읽을 수 있음.
const CONFIRM_TEXT =
  "[이사짐캐리] 방문견적 신청이 접수되었습니다. 보통 1일 이내, 늦어도 3일 안에 담당자가 연락드립니다.";

export async function POST(request: Request) {
  const payload = await request.json();
  const phone: string = String(payload.phone ?? "").replace(/\D/g, "");
  if (!/^01\d{8,9}$/.test(phone)) return NextResponse.json({ error: "연락처 형식 오류" }, { status: 400 });

  const endpoint = process.env.QUOTE_ENDPOINT;
  if (endpoint) {
    const r = await fetch(endpoint, { method: "POST", body: JSON.stringify(payload) });
    if (!r.ok) return NextResponse.json({ error: "접수 저장 실패" }, { status: 502 });
  }

  // 문자 실패는 접수 자체를 막지 않음 — 로그만 남기고 성공 응답
  let smsSent = true;
  try { await sendSms(phone, CONFIRM_TEXT); } catch (e) { smsSent = false; console.error("[quote] sms failed:", e); }

  return NextResponse.json({ ok: true, smsSent });
}
