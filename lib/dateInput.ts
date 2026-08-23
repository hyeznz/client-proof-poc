// type="date"는 placeholder가 안 보임 → 평소 text, focus 시 date로 전환해 네이티브 피커 표시.
export function dateFocus(e: React.FocusEvent<HTMLInputElement>) {
  const el = e.currentTarget;
  el.type = "date";
  try { el.showPicker?.(); } catch {}
}
export function dateBlur(e: React.FocusEvent<HTMLInputElement>) {
  const el = e.currentTarget;
  if (!el.value) el.type = "text";
}
