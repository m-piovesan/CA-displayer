import { CA_PARAMS } from "./types";

/**
 * Gaussian hill fitness function — fixed landscape, always the same.
 * f(x, y) = exp( -((x - cx)² + (y - cy)²) / s )
 * Maximum = 1.0 exactly at (PEAK_X, PEAK_Y).
 */
export function evaluate(x: number, y: number): number {
  const { PEAK_X, PEAK_Y, HILL_S } = CA_PARAMS;
  const dx = x - PEAK_X;
  const dy = y - PEAK_Y;
  return Math.exp(-(dx * dx + dy * dy) / HILL_S);
}

/**
 * Compute a grid of fitness values for the heatmap background.
 * Returns a flat array of length resolution² in row-major order (y first, x second).
 */
export function computeHeatmap(resolution: number): Float32Array {
  const { DOMAIN_MIN, DOMAIN_MAX } = CA_PARAMS;
  const range = DOMAIN_MAX - DOMAIN_MIN;
  const grid = new Float32Array(resolution * resolution);
  for (let row = 0; row < resolution; row++) {
    const y = DOMAIN_MAX - (row / (resolution - 1)) * range; // top-down
    for (let col = 0; col < resolution; col++) {
      const x = DOMAIN_MIN + (col / (resolution - 1)) * range;
      grid[row * resolution + col] = evaluate(x, y);
    }
  }
  return grid;
}
