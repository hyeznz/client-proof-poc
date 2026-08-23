// 닉네임 익명화: "모리깅" → "모∗∗". 앞 한 글자만 노출, 나머지는 U+2217(가운데 정렬 별표).
export function maskNickname(name: string): { head: string; stars: string }[] {
  const trimmed = String(name || "").trim();
  return trimmed.split(/\s+/).filter(Boolean).map((seg) => {
    const chars = [...seg];
    return { head: chars[0] ?? "", stars: "∗".repeat(Math.max(0, chars.length - 1)) };
  });
}
