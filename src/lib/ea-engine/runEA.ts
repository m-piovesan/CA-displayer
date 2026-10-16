import { CA_PARAMS, GenerationSnapshot, Individual } from "../ca-engine/types";
import { evaluate } from "../ca-engine/objectiveFunction";
import { createRng } from "../ca-engine/seededRandom";

const { POP_SIZE, MAX_GEN, DOMAIN_MIN, DOMAIN_MAX, SEED, STEP_LARGE, HILL_S } =
  CA_PARAMS;

const RANGE = DOMAIN_MAX - DOMAIN_MIN;

/** Clamp a value to [DOMAIN_MIN, DOMAIN_MAX]. */
function clamp(v: number): number {
  return Math.max(DOMAIN_MIN, Math.min(DOMAIN_MAX, v));
}

/**
 * Box-Muller transform: converts two uniform [0,1) samples into one N(0,1) sample.
 * Identical to the implementation used in the CA engine — same distribution, same cost.
 */
function gaussian(rng: () => number): number {
  const u1 = Math.max(1e-10, rng());
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Build population stats. */
function stats(population: Individual[]): {
  bestFitness: number;
  avgFitness: number;
  worstFitness: number;
} {
  let best = -Infinity;
  let worst = Infinity;
  let sum = 0;
  for (const ind of population) {
    if (ind.fitness > best) best = ind.fitness;
    if (ind.fitness < worst) worst = ind.fitness;
    sum += ind.fitness;
  }
  return {
    bestFitness: best,
    avgFitness: sum / population.length,
    worstFitness: worst,
  };
}

/**
 * Plain Evolutionary Algorithm — generator yielding one GenerationSnapshot per call.
 *
 * Differences from runCA():
 *   - NO belief space: no leader pull, no normative range guidance.
 *   - Every individual receives an isotropic Gaussian mutation each generation.
 *   - Step size decays linearly (same schedule as the CA's largeStep) so the
 *     comparison isolates the belief-space mechanism as the sole variable.
 *   - Uses the SAME seed and initial population as the CA for a fair baseline.
 *
 * The returned GenerationSnapshot reuses the same type as the CA. The
 * `beliefSpace` field is populated with a stub (leader = current best,
 * normativeRange = full domain) so SearchSpaceCanvas can render it unchanged —
 * the normative rectangle simply covers the whole domain and is not meaningful.
 */
export function* runEA(): Generator<GenerationSnapshot> {
  const rng = createRng(SEED);

  // ── Build initial population (identical to CA's generation 0) ────────────
  let population: Individual[] = Array.from({ length: POP_SIZE }, () => {
    const x = DOMAIN_MIN + rng() * RANGE;
    const y = DOMAIN_MIN + rng() * RANGE;
    return { x, y, fitness: evaluate(x, y) };
  });

  // ── Generation 0 ─────────────────────────────────────────────────────────
  const initialBest = population.reduce((b, i) => (i.fitness > b.fitness ? i : b));
  yield {
    generation: 0,
    population: population.map((i) => ({ ...i })),
    beliefSpace: {
      leader: { ...initialBest },
      normativeRange: {
        x: [DOMAIN_MIN, DOMAIN_MAX],
        y: [DOMAIN_MIN, DOMAIN_MAX],
      },
    },
    ...stats(population),
  };

  // ── Generations 1 … MAX_GEN ───────────────────────────────────────────────
  for (let gen = 1; gen <= MAX_GEN; gen++) {
    // Same linear decay schedule as the CA's largeStep — fair comparison
    const step = STEP_LARGE * (1 - 0.4 * (gen / MAX_GEN));

    const prevBest = population.reduce((b, i) =>
      i.fitness > b.fitness ? i : b
    );

    // Pure Gaussian mutation — no guidance whatsoever
    population = population.map((ind) => {
      const newX = clamp(ind.x + step * gaussian(rng));
      const newY = clamp(ind.y + step * gaussian(rng));
      return { x: newX, y: newY, fitness: evaluate(newX, newY) };
    });

    // Elitism: if the new generation lost the previous best, put it back in
    // place of the worst individual (prevents best-fitness regression).
    let bestIdx = 0;
    let worstIdx = 0;
    for (let i = 1; i < population.length; i++) {
      if (population[i].fitness > population[bestIdx].fitness) bestIdx = i;
      if (population[i].fitness < population[worstIdx].fitness) worstIdx = i;
    }
    if (population[bestIdx].fitness < prevBest.fitness) {
      population[worstIdx] = { ...prevBest };
      bestIdx = worstIdx;
    }
    const currentBest = population[bestIdx];

    // Stub belief space — leader tracks current best for the canvas marker
    const beliefSpaceStub = {
      leader: { ...currentBest },
      normativeRange: {
        x: [DOMAIN_MIN, DOMAIN_MAX] as [number, number],
        y: [DOMAIN_MIN, DOMAIN_MAX] as [number, number],
      },
    };

    yield {
      generation: gen,
      population: population.map((i) => ({ ...i })),
      beliefSpace: beliefSpaceStub,
      ...stats(population),
    };
  }
}

/**
 * Pre-compute ALL EA snapshots at once.
 * Symmetric with precomputeAllSnapshots() in runCA.ts.
 */
export function precomputeAllEASnapshots(): GenerationSnapshot[] {
  const snapshots: GenerationSnapshot[] = [];
  for (const snap of runEA()) {
    snapshots.push(snap);
  }
  return snapshots;
}
