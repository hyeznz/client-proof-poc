"use client";
import { useEffect, useRef, useState } from "react";
import { dateBlur, dateFocus } from "@/lib/dateInput";
import { resizeImageToBlob } from "@/lib/imageResize";
import { createBrowserClient } from "@/lib/supabase/client";

const MAX_PHOTOS = 10;

const REVIEW_TYPES = ["가정포장이사", "보관이사", "사무실이사", "원룸이사", "기타"];
const STAR_PATH = "M12 2l2.93 6.95L22 10l-5.5 4.7L18.18 22 12 18.27 5.82 22l1.68-7.3L2 10l7.07-1.05L12 2z";

// 닉네임 풀 — 30~40대 주부 취향: 따뜻하고 밝은, 집/일상 단어 (원본 복붙)
const NICK_ADJ = [
  "따뜻한", "포근한", "햇살같은", "향긋한", "달콤한", "부드러운", "정갈한", "산뜻한", "평온한", "봄날의",
  "행복한", "다정한", "살뜻한", "알뜽한", "반짝이는", "맑은", "청량한", "사랑스런", "즐거운", "따스한",
  "보송한", "소복한", "폭신한", "상큼한", "아름다운", "고요한", "조용한", "설레는", "황금빛", "몽글한",
];
const NICK_NOUN = [
  "라떼", "햇살", "구름", "마들렌", "식탁", "정원", "화분", "베란다", "거실", "주방", "커튼", "토스트",
  "마카롱", "캐모마일", "머그컵", "스콘", "비누", "빨래", "라벤더", "페퍼민트", "무화과",
  "베이글", "바질", "양말", "담요", "쿠션", "양촛", "책장", "데이지", "튤립", "수국", "동네", "이불",
  "스푸", "나란·", "허브", "부드런빵", "내린내린·", "티타임",
];
const randomNick = () =>
  NICK_ADJ[Math.floor(Math.random() * NICK_ADJ.length)] + NICK_NOUN[Math.floor(Math.random() * NICK_NOUN.length)];

type Props = { open: boolean; onClose: () => void };

// 후기 작성 모달 — 셔플 닉네임 + 0.5 단위 별점 + 인라인 사진 에디터. 저장은 2차(백엔드)에서.
export default function ReviewModal({ open, onClose }: Props) {
  const form = useRef<HTMLFormElement>(null);
  const editor = useRef<HTMLDivElement>(null);
  const [type, setType] = useState("");
  const [locked, setLocked] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [nick, setNick] = useState("정갈한라떼");
  const [submitting, setSubmitting] = useState(false);
  const [submitLabel, setSubmitLabel] = useState("");
  // 에디터에 삽입된 사진의 리사이즈된 Blob + object URL. key = data-photo-id.
  const photos = useRef(new Map<string, { blob: Blob; url: string }>());
  // "사진 삽입" 라벨을 누르면 네이티브 파일 선택창이 뜨는 동안 에디터가 포커스를 잃고,
  // 선택창이 닫힌 뒤 ed.focus()만으로는 커서 위치가 복원되지 않고 맨 앞으로 튐(브라우저 공통 동작).
  // → 포커스를 잃는 순간(에디터 blur) 커서 위치를 직접 기억해뒀다가, 삽입 시 그 위치를 복원.
  const savedRange = useRef<Range | null>(null);

  // 사진 업로드 없이 모달을 닫거나(취소) 컴포넌트가 사라질 때 object URL 누수 방지
  const revokeAllPhotos = () => {
    photos.current.forEach((p) => URL.revokeObjectURL(p.url));
    photos.current.clear();
  };
  useEffect(() => () => revokeAllPhotos(), []);
  useEffect(() => {
    // 사진 업로드 없이(취소) 닫힐 때만 해당 — 제출 성공 시엔 submit()이 먼저 비움
    if (!open) { revokeAllPhotos(); savedRange.current = null; if (editor.current) editor.current.innerHTML = ""; }
  }, [open]);

  // 랜덤 닉네임은 서버 HTML과 달라지면 hydration 불일치 → 마운트 후 클라이언트에서만 생성
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setNick(randomNick()); }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const shown = hover ?? locked;
  const valueAt = (idx: number, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return idx + ((e.clientX - rect.left) < rect.width / 2 ? 0.5 : 1);
  };

  const captureCursor = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editor.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const insertImageAtCursor = (ed: HTMLDivElement, img: HTMLImageElement) => {
    ed.focus();
    const sel = window.getSelection();
    if (sel && savedRange.current && ed.contains(savedRange.current.startContainer)) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(img);
      const br = document.createElement("br");
      img.parentNode?.insertBefore(br, img.nextSibling);
      const nr = document.createRange();
      nr.setStartAfter(br);
      nr.collapse(true);
      sel.removeAllRanges();
      sel.addRange(nr);
      savedRange.current = nr.cloneRange(); // 같은 배치에서 다음 사진도 이어서 삽입되도록
    } else {
      ed.appendChild(img);
      ed.appendChild(document.createElement("br"));
      const nr = document.createRange();
      nr.selectNodeContents(ed);
      nr.collapse(false);
      savedRange.current = nr.cloneRange();
    }
  };

  // 인라인 사진 삽입 — 커서 위치에(없으면 끝에), 리사이즈 후 최대 10장까지.
  // 원본 파일은 버리고 리사이즈된 Blob만 들고 있다가 제출 시 업로드 (큰 원본이 DB/저장공간에 안 실림).
  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const ed = editor.current;
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    e.target.value = "";
    if (!ed) return;

    const remaining = MAX_PHOTOS - ed.querySelectorAll("img").length;
    if (remaining <= 0) { alert(`사진은 최대 ${MAX_PHOTOS}장까지 첨부할 수 있어요.`); return; }
    const toAdd = files.slice(0, remaining);
    if (files.length > toAdd.length) alert(`사진은 최대 ${MAX_PHOTOS}장까지 첨부할 수 있어요. ${toAdd.length}장만 추가했어요.`);

    for (const file of toAdd) {
      try {
        const blob = await resizeImageToBlob(file);
        const id = crypto.randomUUID();
        const url = URL.createObjectURL(blob);
        photos.current.set(id, { blob, url });
        const img = document.createElement("img");
        img.src = url;
        img.alt = file.name;
        img.dataset.photoId = id;
        insertImageAtCursor(ed, img);
      } catch {
        alert(`"${file.name}" 사진을 처리하지 못했어요. 건너뛸게요.`);
      }
    }
  };

  const submit = async () => {
    const f = form.current, ed = editor.current;
    if (!f || !ed) return;
    if (!f.checkValidity()) { f.reportValidity(); return; }
    if (!type) { alert("이사 유형을 선택해주세요."); return; }
    if (locked < 1) { alert("만족도를 선택해주세요."); return; }
    if (ed.innerText.trim().length < 10) { alert("후기를 10자 이상 작성해주세요."); return; }

    const moveDate = f.querySelector<HTMLInputElement>("#rf-date")?.value || null;
    const phone = f.querySelector<HTMLInputElement>("#rf-phone")?.value || "";

    // 에디터 DOM 순서대로 훑어서 본문 텍스트를 만들고, <img>는 [PHOTO:N] 표시로 바꿈
    // (사진 자체는 이 문자열에 안 실림 — 아래에서 저장공간에 따로 업로드).
    // 상세 시트는 "빈 줄로 나뉜 문단"만 사진으로 인식하므로, 사진 앞뒤에 빈 줄을 확실히 둠
    // (앞에 텍스트가 줄바꿈 없이 바로 붙어도 한 문단으로 뭉치지 않도록).
    let content = "";
    const photoIds: string[] = [];
    ed.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) content += node.textContent ?? "";
      else if (node instanceof HTMLBRElement) content += "\n";
      else if (node instanceof HTMLImageElement && node.dataset.photoId) {
        photoIds.push(node.dataset.photoId);
        content += `\n\n[PHOTO:${photoIds.length}]\n\n`;
      }
    });
    content = content.replace(/\n{3,}/g, "\n\n").trim();

    setSubmitting(true);
    setSubmitLabel(photoIds.length ? "사진 업로드 중..." : "접수 중...");

    const supabase = createBrowserClient();
    const photoUrls: string[] = [];
    for (const id of photoIds) {
      const entry = photos.current.get(id);
      if (!entry) continue;
      const path = `${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("review-photos")
        .upload(path, entry.blob, { contentType: "image/jpeg" });
      if (uploadError) {
        setSubmitting(false);
        alert("사진 업로드 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.");
        return;
      }
      photoUrls.push(supabase.storage.from("review-photos").getPublicUrl(path).data.publicUrl);
    }

    setSubmitLabel("접수 중...");
    // 관리자가 승인(status='published')해야 페이지에 노출됨.
    const { error } = await supabase.from("reviews").insert({
      move_date: moveDate,
      type,
      rating: locked,
      content,
      nickname: nick,
      phone,
      photos: photoUrls,
    });
    setSubmitting(false);
    if (error) {
      alert("접수 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    alert("후기가 접수되었습니다. 내용 검토 후 리뷰 페이지에 게재됩니다.✨");
    onClose();
    f.reset();
    ed.innerHTML = "";
    revokeAllPhotos();
    savedRange.current = null;
    setType(""); setLocked(0); setNick(randomNick());
  };

  const cls = (b: string) => b + (open ? " open" : "");
  return (
    <>
      <div className={cls("review-overlay")} onClick={onClose} />
      <div className={cls("review-modal")} role="dialog" aria-modal="true" aria-hidden={!open} aria-labelledby="review-title">
        <div className="review-header">
          <button className="review-close" aria-label="닫기" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18" /><line x1="6" y1="18" x2="18" y2="6" /></svg>
          </button>
          <h2 id="review-title">이사짐캐리와 함께한 이사,<br />어떠셨어요?</h2>
          <p>좋았던 점도, 살짝 아쉬웠던 점도 모두 환영이에요. 솔직한 한 마디가 다음 고객에게 가장 큰 도움이 됩니다 :)</p>
          <p>로그인 없이 익명으로 작성 가능하며, 휴대폰 번호는 고객 확인용으로만 사용됩니다.</p>
        </div>
        <form className="review-body" ref={form} onSubmit={(e) => e.preventDefault()}>
          <hr />
          <div className="review-section">
            <label htmlFor="rf-date">1. 진행된 이사날짜를 선택해주세요.<span className="req">*</span></label>
            <input type="text" id="rf-date" name="moveDate" placeholder="날짜를 선택해주세요" required onFocus={dateFocus} onBlur={dateBlur} />
          </div>
          <div className="review-section">
            <span className="review-q">2. 이사 유형을 선택해주세요.<span className="req">*</span></span>
            <div className="review-chips">
              {REVIEW_TYPES.map((t, i) => (
                <button type="button" key={t} className={"review-chip" + (type === t ? " active" : "")} onClick={() => setType(t)}>
                  <span className="chip-letter">{String.fromCharCode(65 + i)}</span>{t}
                </button>
              ))}
            </div>
          </div>
          <div className="review-section">
            <span className="review-q">3. 전반적인 만족도가 어떠셨나요?<span className="req">*</span></span>
            <div className="star-rating" role="radiogroup" aria-label="만족도" onMouseLeave={() => setHover(null)}>
              {[0, 1, 2, 3, 4].map((idx) => {
                const i = idx + 1;
                const state = shown >= i ? " full" : shown >= i - 0.5 ? " half" : "";
                return (
                  <div key={i} className={"star-wrap" + state}
                    onMouseMove={(e) => setHover(valueAt(idx, e))}
                    onClick={(e) => { const v = valueAt(idx, e); setLocked(v); setHover(null); }}>
                    <svg className="star-bg" viewBox="0 0 24 24" fill="currentColor"><path d={STAR_PATH} /></svg>
                    <svg className="star-fg" viewBox="0 0 24 24" fill="currentColor"><path d={STAR_PATH} /></svg>
                  </div>
                );
              })}
              <span className="rating-readout">{shown > 0 ? shown.toFixed(1) : ""}</span>
            </div>
            <input type="hidden" name="rating" value={locked} readOnly />
          </div>
          <div className="review-section">
            <span className="review-q">4. 후기를 자유롭게 작성해주세요 😊<span className="req">*</span></span>
            <div className="editor-wrap">
              <div className="editor-toolbar">
                <label className="editor-tool" title="사진 삽입">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                  사진 삽입
                  <input type="file" className="file-input" accept="image/*" multiple onChange={onFiles} />
                </label>
              </div>
              <div
                className="editor"
                ref={editor}
                contentEditable
                suppressContentEditableWarning
                onBlur={captureCursor}
                data-placeholder={"· 이사 당일 경험은 어떠셨나요?\n· 작업자분들은 친절하셨나요?\n· 짐을 조심스럽게 다뤄주셨나요?\n· 추가 비용 없이 깔끔하게 마무리되었나요?\n· 또 이용하고 싶으신가요?\n\n편하게 자유롭게 적어주세요 😊"}
              />
            </div>
            <p className="editor-tip">💡 사진은 본문 사이에 원하는 위치로 삽입됩니다 (최대 {MAX_PHOTOS}장). 사진을 클릭하고 Delete로 삭제 가능합니다.</p>
          </div>
          <hr className="review-divider" />
          <div className="review-section">
            <span className="review-q">5. 닉네임<span className="req">*</span></span>
            <div className="nick-row">
              <input type="text" id="rf-nickname" name="nickname" className="nick-input" readOnly required value={nick} onClick={() => setNick(randomNick())} />
              <button type="button" className="nick-shuffle" aria-label="다시 생성" onClick={() => setNick(randomNick())}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
                다시 생성
              </button>
            </div>
          </div>
          <div className="review-section">
            <label htmlFor="rf-phone">6. 휴대폰 번호를 입력해주세요<span className="req">*</span></label>
            <div className="review-phone-row">
              <input type="tel" id="rf-phone" name="phone" placeholder="'-' 없이 숫자만 입력 (예: 01012341234)" required pattern="[0-9]{10,11}" />
              <span className="phone-note">(고객 확인용으로만 사용되며 외부에 공개되지 않습니다)</span>
            </div>
          </div>
        </form>
        <div className="review-footer">
          <button type="button" className="review-submit" onClick={submit} disabled={submitting}>
            {submitting ? submitLabel : <>제출 <span aria-hidden="true">→</span></>}
          </button>
        </div>
      </div>
    </>
  );
}
