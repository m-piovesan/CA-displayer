import { CA_PARAMS, GenerationSnapshot, Individual } from "./types";
import { evaluate } from "./objectiveFunction";
import { createRng } from "./seededRandom";
import { initBeliefSpace, updateBeliefSpace } from "./beliefSpace";
import { mutatePopulation } from "./mutation";

const { POP_SIZE, MAX_GEN, DOMAIN_MIN, DOMAIN_MAX, SEED } = CA_PARAMS;

/** Build stats from a population array. */
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
 * Generator that yields one GenerationSnapshot per call.
 * - First yield: generation 0 (initial random population).
 * - Then yields generations 1 … MAX_GEN.
 *
 * Always uses the same fixed seed so Reset is deterministic.
 */
export function* runCA(): Generator<GenerationSnapshot> {
  const rng = createRng(SEED);
  const range = DOMAIN_MAX - DOMAIN_MIN;

  // ── Build initial population ──────────────────────────────────────────────
  let population: Individual[] = Array.from({ length: POP_SIZE }, () => {
    const x = DOMAIN_MIN + rng() * range;
    const y = DOMAIN_MIN + rng() * range;
    return { x, y, fitness: evaluate(x, y) };
  });

  // ── Generation 0 ─────────────────────────────────────────────────────────
  let beliefSpace = initBeliefSpace(population);
  yield {
    generation: 0,
    population: population.map((i) => ({ ...i })),
    beliefSpace: {
      leader: { ...beliefSpace.leader },
      normativeRange: {
        x: [...beliefSpace.normativeRange.x],
        y: [...beliefSpace.normativeRange.y],
      },
    },
    ...stats(population),
  };

  // ── Generations 1 … MAX_GEN ───────────────────────────────────────────────
  for (let gen = 1; gen <= MAX_GEN; gen++) {
    // Decay large step size slightly over time to encourage convergence
    const largeStep = CA_PARAMS.STEP_LARGE * (1 - 0.4 * (gen / MAX_GEN));

    population = mutatePopulation(population, beliefSpace, rng, largeStep);
    beliefSpace = updateBeliefSpace(beliefSpace, population);

    yield {
      generation: gen,
      population: population.map((i) => ({ ...i })),
      beliefSpace: {
        leader: { ...beliefSpace.leader },
        normativeRange: {
          x: [...beliefSpace.normativeRange.x],
          y: [...beliefSpace.normativeRange.y],
        },
      },
      ...stats(population),
    };
  }
}

/**
 * Pre-compute ALL snapshots at once (trivial cost for 30 individuals × 150 gen).
 * Used by the Zustand store so the UI just indexes into the array.
 */
export function precomputeAllSnapshots(): GenerationSnapshot[] {
  const snapshots: GenerationSnapshot[] = [];
  for (const snap of runCA()) {
    snapshots.push(snap);
  }
  return snapshots;
}
