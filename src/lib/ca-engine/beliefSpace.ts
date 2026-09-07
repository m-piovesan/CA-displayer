import { BeliefSpace, Individual, CA_PARAMS } from "./types";

const { DOMAIN_MIN, DOMAIN_MAX } = CA_PARAMS;

/**
 * Initialize the belief space from generation 0.
 * Leader = best individual; normative range = full population bounding box.
 */
export function initBeliefSpace(population: Individual[]): BeliefSpace {
  const leader = population.reduce((best, ind) =>
    ind.fitness > best.fitness ? ind : best
  );

  const xValues = population.map((i) => i.x);
  const yValues = population.map((i) => i.y);

  return {
    leader,
    normativeRange: {
      x: [Math.min(...xValues), Math.max(...xValues)],
      y: [Math.min(...yValues), Math.max(...yValues)],
    },
  };
}

/**
 * Update the belief space after a new generation.
 * 1. Update leader if a better individual exists in this generation.
 * 2. Recalculate normative range from individuals whose fitness is above-average.
 */
export function updateBeliefSpace(
  current: BeliefSpace,
  population: Individual[]
): BeliefSpace {
  // ── 1. Update leader ──────────────────────────────────────────────────────
  const genBest = population.reduce((best, ind) =>
    ind.fitness > best.fitness ? ind : best
  );
  const leader =
    genBest.fitness > current.leader.fitness ? genBest : current.leader;

  // ── 2. Normative range from above-average individuals ─────────────────────
  const avgFitness =
    population.reduce((sum, ind) => sum + ind.fitness, 0) / population.length;

  const aboveAvg = population.filter((ind) => ind.fitness >= avgFitness);

  // Fallback: if nothing beats average (degenerate case), use full population.
  const sample = aboveAvg.length > 0 ? aboveAvg : population;

  const xVals = sample.map((i) => i.x);
  const yVals = sample.map((i) => i.y);

  // Clamp range to domain to avoid visual overflow.
  const normativeRange = {
    x: [
      Math.max(DOMAIN_MIN, Math.min(...xVals)),
      Math.min(DOMAIN_MAX, Math.max(...xVals)),
    ] as [number, number],
    y: [
      Math.max(DOMAIN_MIN, Math.min(...yVals)),
      Math.min(DOMAIN_MAX, Math.max(...yVals)),
    ] as [number, number],
  };

  return { leader, normativeRange };
}
