import { BeliefSpace, Individual, CA_PARAMS } from "./types";
import { evaluate } from "./objectiveFunction";

const {
  DOMAIN_MIN,
  DOMAIN_MAX,
  STEP_LARGE,
  STEP_SMALL,
  LEADER_PULL,
  LEADER_FRACTION,
} = CA_PARAMS;

/** Clamp a value to [DOMAIN_MIN, DOMAIN_MAX]. */
function clamp(v: number): number {
  return Math.max(DOMAIN_MIN, Math.min(DOMAIN_MAX, v));
}

/**
 * Apply adaptive mutation to a single coordinate dimension.
 *
 * - Outside normative range → large exploration step toward the range.
 * - Inside normative range  → small refinement step.
 */
function mutateCoord(
  value: number,
  range: [number, number],
  rng: () => number,
  step: number
): number {
  const [lo, hi] = range;
  const inside = value >= lo && value <= hi;
  const sigma = inside ? STEP_SMALL : step;
  // Gaussian-like: use Box-Muller with two uniform draws
  const u1 = Math.max(1e-10, rng());
  const u2 = rng();
  const gauss = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

  let newVal = value + sigma * gauss;

  // If outside range, add a small bias toward the center of the normative range
  if (!inside) {
    const center = (lo + hi) / 2;
    newVal += 0.15 * (center - value);
  }

  return clamp(newVal);
}

/**
 * Produce the next generation by applying adaptive mutation guided by the
 * belief space (normative + situational influence).
 */
export function mutatePopulation(
  population: Individual[],
  beliefSpace: BeliefSpace,
  rng: () => number,
  largeStep: number = STEP_LARGE
): Individual[] {
  const { leader, normativeRange } = beliefSpace;
  const n = population.length;
  // Randomly select ~20% of individuals to receive situational leader pull
  const leaderCount = Math.max(1, Math.round(n * LEADER_FRACTION));
  // Shuffle indices and pick the first `leaderCount`
  const indices = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const leaderSet = new Set(indices.slice(0, leaderCount));

  return population.map((ind, idx) => {
    let newX: number;
    let newY: number;

    if (leaderSet.has(idx)) {
      // ── Situational influence: pull toward leader + noise ────────────────
      const u1 = Math.max(1e-10, rng());
      const u2 = rng();
      const gaussX = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const u3 = Math.max(1e-10, rng());
      const u4 = rng();
      const gaussY = Math.sqrt(-2 * Math.log(u3)) * Math.cos(2 * Math.PI * u4);

      newX = clamp(
        ind.x + LEADER_PULL * (leader.x - ind.x) + STEP_SMALL * gaussX
      );
      newY = clamp(
        ind.y + LEADER_PULL * (leader.y - ind.y) + STEP_SMALL * gaussY
      );
    } else {
      // ── Normative influence: adaptive mutation ───────────────────────────
      newX = mutateCoord(ind.x, normativeRange.x, rng, largeStep);
      newY = mutateCoord(ind.y, normativeRange.y, rng, largeStep);
    }

    return { x: newX, y: newY, fitness: evaluate(newX, newY) };
  });
}
