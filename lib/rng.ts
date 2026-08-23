// 문자열 시드 → 정수 해시 (xmur3). 원본 HTML에서 복붙.
export function hashSeed(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

// 시드 기반 결정적 난수 (mulberry32). 같은 시드 = 같은 수열.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 가중치 뽑기. weights 합에 비례해 하나 선택.
export function weightedPick<T extends string>(
  items: readonly T[],
  weights: Record<T, number>,
  rng: () => number,
): T {
  const total = items.reduce((s, it) => s + weights[it], 0);
  let r = rng() * total;
  for (const it of items) {
    r -= weights[it];
    if (r < 0) return it;
  }
  return items[items.length - 1];
}
