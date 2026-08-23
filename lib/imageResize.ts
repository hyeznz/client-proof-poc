// 원본 폰 사진(보통 3~10MB)을 DB/저장공간 부담이 적은 크기로 줄임.
// 긴 변 기준 최대 1440px, JPEG 82% 품질 — 리뷰 상세 화면에서 보기엔 충분하고 대개 150~350KB로 줄어듦.
const MAX_DIMENSION = 1440;
const JPEG_QUALITY = 0.82;

export async function resizeImageToBlob(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context 생성 실패");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("이미지 변환 실패"))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}
