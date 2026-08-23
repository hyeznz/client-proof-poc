"use client";
import { useEffect, useRef, useState } from "react";
import { dateBlur, dateFocus } from "@/lib/dateInput";

const MOVE_TYPES = ["원룸이사", "포장이사", "안심포장이사", "보관이사", "사무실이사", "장거리이사", "기타"];
const HOT = new Set(["안심포장이사", "보관이사"]);
const TIMES: [string, string][] = [["오전", "오전 (9-12시)"], ["오후", "오후 (12-3시)"], ["저녁", "저녁 (3-6시)"], ["언제든", "언제든 가능"]];

function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

// 카카오(Daum) 우편번호 스크립트 지연 로드
type PostcodeData = { roadAddress?: string; jibunAddress?: string; address?: string };
declare global {
  interface Window { daum?: { Postcode: new (o: object) => { embed: (el: HTMLElement) => void } } }
}
let postcodeLoading: Promise<boolean> | null = null;
function ensurePostcodeLoaded(): Promise<boolean> {
  if (window.daum?.Postcode) return Promise.resolve(true);
  if (!postcodeLoading) {
    postcodeLoading = new Promise<boolean>((resolve) => {
      const s = document.createElement("script");
      const timer = setTimeout(() => { s.remove(); resolve(false); }, 4500);
      s.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      s.async = true;
      s.onload = () => { clearTimeout(timer); resolve(!!window.daum?.Postcode); };
      s.onerror = () => { clearTimeout(timer); s.remove(); resolve(false); };
      document.head.appendChild(s);
    }).then((ok) => { if (!ok) postcodeLoading = null; return ok; });
  }
  return postcodeLoading;
}

type Props = { open: boolean; onClose: () => void };

export default function QuoteModal({ open, onClose }: Props) {
  const form = useRef<HTMLFormElement>(null);
  const [types, setTypes] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [extra, setExtra] = useState(false);
  const [phone, setPhone] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [postcodeTarget, setPostcodeTarget] = useState<"from" | "to" | null>(null);
  const postcodeBody = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    ensurePostcodeLoaded();
    if (window.matchMedia("(min-width: 768px)").matches) {
      setTimeout(() => form.current?.querySelector<HTMLInputElement>("#qf-name")?.focus(), 280);
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // 주소 검색 팝업 — target 정해지면 Daum 위젯 embed
  useEffect(() => {
    if (!postcodeTarget) return;
    let cancelled = false;
    (async () => {
      const ready = await ensurePostcodeLoaded();
      if (cancelled) return;
      if (!ready || !postcodeBody.current || !window.daum) {
        alert("주소 검색 서비스를 준비 중이에요. 잠시 후 다시 눌러주세요.");
        setPostcodeTarget(null);
        return;
      }
      postcodeBody.current.innerHTML = "";
      new window.daum.Postcode({
        width: "100%",
        height: "100%",
        oncomplete: (data: PostcodeData) => {
          const v = data.roadAddress || data.jibunAddress || data.address || "";
          (postcodeTarget === "from" ? setFrom : setTo)(v);
          setPostcodeTarget(null);
          setTimeout(() => form.current?.querySelector<HTMLInputElement>(`#qf-${postcodeTarget}-detail`)?.focus(), 0);
        },
        onclose: () => setPostcodeTarget(null),
      }).embed(postcodeBody.current);
    })();
    return () => { cancelled = true; };
  }, [postcodeTarget]);

  const val = (id: string) =>
    form.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`)?.value.trim() || "";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = formatPhone(phone);
    setPhone(p);
    const missing: string[] = [];
    if (!val("qf-name")) missing.push("이름");
    if (!p) missing.push("연락처");
    if (!val("qf-movedate")) missing.push("이사 예정일");
    if (!types.length) missing.push("이사 종류");
    if (!from) missing.push("출발지 주소");
    if (!to) missing.push("도착지 주소");
    if (missing.length) {
      alert(`필수 정보를 입력해주세요.\n\n빠진 항목: ${missing.join(", ")}`);
      return;
    }
    const payload = {
      name: val("qf-name"), phone: p, movedate: val("qf-movedate"), types,
      from, fromDetail: val("qf-from-detail"), to, toDetail: val("qf-to-detail"),
      visitdate: val("qf-visitdate"), time: TIMES.find((t) => t[0] === time)?.[1] || "",
      memo: val("qf-memo"), pageUrl: location.href, userAgent: navigator.userAgent,
    };
    setSubmitting(true);
    try {
      // 서버(/api/quote)가 구글 시트 저장 + 접수 안내 문자 발송
      const res = await fetch("/api/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("quote failed");
      alert("견적 신청이 접수되었습니다. 입력하신 번호로 접수 안내 문자를 보내드렸어요.");
      onClose();
      form.current?.reset();
      setTypes([]); setTime(""); setPhone(""); setFrom(""); setTo("");
    } catch {
      alert("전송 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const cls = (b: string) => b + (open ? " open" : "");
  return (
    <>
      <div className={cls("quote-overlay")} onClick={onClose} />
      <div className={cls("quote-modal")} role="dialog" aria-modal="true" aria-hidden={!open} aria-labelledby="quote-title">
        <div className="quote-header">
          <button className="quote-close" aria-label="닫기" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" /></svg>
          </button>
          <h2 id="quote-title">방문견적 신청</h2>
          <p>이사짐캐리가 직접 방문하여 정확하고 합리적인 견적을 안내합니다.</p>
          <div className="quote-badges">
            <span>추가요금 0원</span><span className="dot">·</span><span>고객만족 최우선</span><span className="dot">·</span><span>파손 100% 보상</span>
          </div>
        </div>
        <form className="quote-body" ref={form} autoComplete="on" onSubmit={onSubmit}>
          <div className="quote-section">
            <h3 className="quote-section-title"><span>📝 기본 정보</span><span className="req-note">* 필수</span></h3>
            <div className="quote-field"><label htmlFor="qf-name">이름<span className="req">*</span></label><input type="text" id="qf-name" name="name" placeholder="홍길동" required /></div>
            <div className="quote-field"><label htmlFor="qf-phone">연락처<span className="req">*</span></label>
              <input type="tel" id="qf-phone" name="phone" inputMode="numeric" autoComplete="tel" placeholder="010-0000-0000" maxLength={13} required
                value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} />
            </div>
            <div className="quote-field"><label htmlFor="qf-movedate">이사 예정일<span className="req">*</span></label>
              <input type="text" id="qf-movedate" name="movedate" placeholder="날짜를 선택해주세요" required onFocus={dateFocus} onBlur={dateBlur} />
            </div>
            <div className="quote-field"><label>이사 종류<span className="req">*</span> <span className="hint">(복수선택 가능)</span></label>
              <div className="quote-chips" role="group">
                {MOVE_TYPES.map((t) => (
                  <button type="button" key={t} className={"quote-chip" + (types.includes(t) ? " active" : "")}
                    onClick={() => setTypes((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))}>
                    {t}{HOT.has(t) && <span className="hot-badge">HOT</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="quote-section">
            <h3 className="quote-section-title"><span>📍 출발지 / 도착지</span></h3>
            <div className="quote-field"><label htmlFor="qf-from">출발지 주소<span className="req">*</span></label>
              <input type="text" id="qf-from" name="from" placeholder="눌러서 주소 검색" readOnly required value={from} onClick={() => setPostcodeTarget("from")} />
              <input type="text" id="qf-from-detail" name="fromDetail" placeholder="상세주소 : 동/호수 (예: 101동 201호)" style={{ marginTop: 8 }} />
            </div>
            <div className="quote-field"><label htmlFor="qf-to">도착지 주소<span className="req">*</span></label>
              <input type="text" id="qf-to" name="to" placeholder="눌러서 주소 검색" readOnly required value={to} onClick={() => setPostcodeTarget("to")} />
              <input type="text" id="qf-to-detail" name="toDetail" placeholder="상세주소 : 동/호수 (예: 101동 201호)" style={{ marginTop: 8 }} />
            </div>
          </div>
          <div className="quote-section">
            <h3 className="quote-section-title"><span>📅 방문 견적 희망</span></h3>
            <div className="quote-field"><label htmlFor="qf-visitdate">방문 희망일 <span className="hint">(선택)</span></label>
              <input type="text" id="qf-visitdate" name="visitdate" placeholder="날짜를 선택해주세요" onFocus={dateFocus} onBlur={dateBlur} />
            </div>
            <div className="quote-field"><label>희망 시간대 <span className="hint">(선택)</span></label>
              <div className="quote-chips" role="group">
                {TIMES.map(([v, label]) => (
                  <button type="button" key={v} className={"quote-chip" + (time === v ? " active" : "")} onClick={() => setTime(v)}>{label}</button>
                ))}
              </div>
            </div>
            <button type="button" className="quote-extra-toggle" onClick={() => setExtra((x) => !x)}>
              {extra ? "− 추가 정보 접기" : "+ 추가 정보 입력하기 (선택)"}
            </button>
            <div className={"quote-extra-area" + (extra ? " open" : "")}>
              <div className="quote-field"><label htmlFor="qf-memo">메모</label><textarea id="qf-memo" name="memo" rows={3} placeholder="짐 양, 엘리베이터 유무, 특이사항 등 자유로게" /></div>
            </div>
          </div>
          <div className="quote-footer">
            <button type="submit" className="quote-submit" disabled={submitting} style={submitting ? { opacity: 0.62, cursor: "wait" } : undefined}>
              {submitting ? "전송 중입니다..." : "무료견적 신청하기"}
            </button>
          </div>
        </form>
      </div>
      {/* 주소 검색 팝업 */}
      <div className={"postcode-overlay" + (postcodeTarget ? " open" : "")} onClick={(e) => { if (e.target === e.currentTarget) setPostcodeTarget(null); }}>
        <div className="postcode-popup" role="dialog" aria-modal="true" aria-label="주소 검색">
          <div className="postcode-popup-head">
            <span>주소 검색</span>
            <button type="button" className="postcode-popup-close" aria-label="주소 검색 닫기" onClick={() => setPostcodeTarget(null)}>×</button>
          </div>
          <div className="postcode-popup-body" ref={postcodeBody} />
        </div>
      </div>
    </>
  );
}
