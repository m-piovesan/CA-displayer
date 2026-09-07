/**
 * Mulberry32 — a fast, seedable 32-bit PRNG.
 * Returns a factory given an integer seed.
 * Each call to the returned function produces a float in [0, 1).
 */
export function createRng(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
