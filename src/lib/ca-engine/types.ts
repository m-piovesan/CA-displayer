// ─── Core domain types ───────────────────────────────────────────────────────

export type Individual = {
  x: number;
  y: number;
  fitness: number;
};

export type NormativeRange = {
  x: [number, number]; // [min, max] across the above-average individuals
  y: [number, number];
};

export type BeliefSpace = {
  /** Best individual ever seen (never gets worse). */
  leader: Individual;
  /** Normative knowledge: bounding box of the above-average individuals. */
  normativeRange: NormativeRange;
};

export type GenerationSnapshot = {
  generation: number;
  population: Individual[];
  beliefSpace: BeliefSpace;
  bestFitness: number;
  avgFitness: number;
  worstFitness: number;
};

// ─── Algorithm constants (fixed, never configurable) ─────────────────────────

export const CA_PARAMS = {
  POP_SIZE: 30,
  MAX_GEN: 150,
  DOMAIN_MIN: -10,
  DOMAIN_MAX: 10,
  /** Fraction of population that receives direct leader pull (situational). */
  LEADER_FRACTION: 0.2,
  /** Gaussian hill peak position. */
  PEAK_X: 3,
  PEAK_Y: -4,
  /** Gaussian width parameter s — larger = wider hill. */
  HILL_S: 15,
  /** Large mutation step size (outside normative range). */
  STEP_LARGE: 1.8,
  /** Small mutation step size (inside normative range). */
  STEP_SMALL: 0.3,
  /** Weight of leader pull for situationally influenced individuals. */
  LEADER_PULL: 0.35,
  /** Fixed seed for reproducible initial population. */
  SEED: 42,
} as const;
