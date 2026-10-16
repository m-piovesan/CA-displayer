# CA Displayer

An interactive visualization of a **Cultural Algorithm (CA)** applied to continuous 2D function optimization. Watch a population of candidate solutions converge toward the peak of a Gaussian hill, guided by a shared *belief space*. You can also run it **side by side with a plain Evolutionary Algorithm (EA)** to see what the belief space adds.

Built with Next.js, TypeScript and Tailwind CSS. No configuration required: just Play, Pause and Reset.

---

## What is a Cultural Algorithm?

A Cultural Algorithm is an evolutionary computation technique proposed by Robert Reynolds (1994). A standard evolutionary algorithm only maintains a **population** of candidate solutions. A CA also maintains a **belief space**: a store of *collective knowledge* extracted from the best individuals of each generation.

This belief space feeds back into the search process, influencing how the population evolves. The key idea is that the group learns from its own experience and uses that knowledge to guide future exploration.

### The Belief Space

Reynolds' framework describes five knowledge sources (normative, situational, topographic, domain and temporal). This implementation uses the two classic ones:

- **Situational knowledge**: the *leader*, i.e. the single best individual ever found across all generations. It never gets worse. A fraction of the population (20%) is pulled directly toward the leader each generation.

- **Normative knowledge**: the *normative range*, a bounding box (one interval per dimension, x and y) calculated from all individuals whose fitness is above the current generation's average. As the population converges, this rectangle visibly shrinks toward the peak.

### Adaptive Mutation

Each individual is mutated every generation. The step size adapts based on the normative range:

- **Outside the normative range**: large step, biased toward the center of the range (exploration)
- **Inside the normative range**: small step (fine-tuning)

This means that scattered individuals are pushed toward the promising region, while already-focused individuals refine their position locally.

### The Objective Function

A fixed Gaussian hill centered at **(3, −4)** in the domain [−10, 10]²:

```
f(x, y) = exp( -((x − 3)² + (y + 4)²) / 15 )
```

The fitness ranges from 0 (far from the peak) to 1.0 (exactly at the peak). The landscape never changes between runs; only the algorithm's behavior changes.

---

## CA vs EA Comparison

To isolate the effect of the belief space, the project includes a **plain Evolutionary Algorithm** used as a baseline (`src/lib/ea-engine/runEA.ts`).

### How the EA works

- **No belief space**: no leader pull and no normative range.
- Every individual receives an isotropic Gaussian mutation each generation:
  `x' = clamp(x + step · N(0,1))`, and the same for `y`.
- The step size follows the **same linear decay** as the CA's large step (1.8 → ~1.1).
- **Elitism**: the population is replaced by its mutated copies. If the new generation is worse than the previous best, that previous best replaces the worst new individual. As a result, the EA's best fitness never decreases.

### What is kept identical (fair comparison)

| Aspect | CA | EA |
|---|---|---|
| Objective function | Gaussian hill | Gaussian hill |
| Seed / initial population | `SEED = 42` | `SEED = 42` (same generation 0) |
| Population / generations | 30 / 150 | 30 / 150 |
| Gaussian noise | Box-Muller | Box-Muller |
| Step decay schedule | `1.8 · (1 − 0.4 · gen/150)` | same |
| Belief space (leader + normative range) | ✅ | ❌ |

The only difference between the two runs is the belief space.

### Rendering the EA

The EA reuses the same `GenerationSnapshot` type, so `SearchSpaceCanvas` renders it unchanged. Its `beliefSpace` field is a **stub**: the "leader" is just the best individual of the current generation, and the "normative range" covers the whole domain (it has no meaning for the EA).

> See [`EA-vs-CA.md`](EA-vs-CA.md) for a longer discussion of the comparison, and [`ALGORITMO.md`](ALGORITMO.md) for a step-by-step walkthrough of the CA (in Portuguese).

---

## Pages

| Page | Description |
|---|---|
| `/` | Title, brief description, and links to both simulations |
| `/demo` | The CA on its own: heatmap, population dots, normative rectangle, leader star, fitness chart, and belief space readout |
| `/compare` | CA and EA side by side, sharing one Play/Pause/Reset control, with a combined fitness chart and a winner badge at the end |

### Visualization elements

| Element | Meaning |
|---|---|
| Heatmap (inferno palette) | The objective function: brighter = closer to the peak |
| Colored dots | Individuals in the current generation |
| Dashed blue rectangle | CA normative range, the "focused search zone" |
| ★ Gold star | CA: the leader (best ever). EA: best of the current generation |
| White crosshair | The true peak location (3, −4) |
| Fitness chart (`/demo`) | Best / average / worst fitness per generation |
| Comparison chart (`/compare`) | CA best/avg (green) vs EA best/avg (amber), with a reference line at the maximum (1.0) |
| Winner badge (`/compare`) | Shown when the run ends: which algorithm had the higher best fitness, and by how much (Δ) |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

```bash
# Production build
npm run build
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                   # Home page
│   ├── demo/page.tsx              # CA simulation page
│   └── compare/page.tsx           # CA vs EA side-by-side page
├── components/
│   ├── SearchSpaceCanvas.tsx      # SVG visualization (heatmap + dots + leader + rect)
│   ├── FitnessChart.tsx           # Recharts line chart (best/avg/worst)
│   ├── ComparisonFitnessChart.tsx # Recharts chart overlaying CA and EA curves
│   ├── SimulationControls.tsx     # Play / Pause / Reset + progress bar
│   └── FixedParamsPanel.tsx       # Read-only parameter display
└── lib/
    ├── store.ts                   # Zustand state: CA + EA snapshots, shared playback
    ├── ca-engine/
    │   ├── types.ts               # Types and fixed constants (shared with the EA)
    │   ├── seededRandom.ts        # Deterministic PRNG (same initial pop every Reset)
    │   ├── objectiveFunction.ts   # Gaussian hill
    │   ├── beliefSpace.ts         # Leader tracking + normative range update
    │   ├── mutation.ts            # Adaptive mutation + situational influence
    │   └── runCA.ts               # Generator function, one snapshot per generation
    └── ea-engine/
        └── runEA.ts               # Plain EA baseline (Gaussian mutation, no belief space)
```

Both engines are **pure TypeScript with no React dependencies**. The EA reuses the CA's types, objective function and PRNG. On load, the store precomputes all 151 snapshots (generations 0–150) of **both** algorithms, and the UI just indexes into them by `currentGen`. Both pages therefore stay in sync with the same controls.

---

## Fixed Parameters

| Parameter | Value |
|---|---|
| Population size | 30 |
| Generations | 150 |
| Domain | [−10, 10]² |
| Peak | (3, −4) |
| Hill width (s) | 15 |
| Leader pull fraction (CA) | 20% |
| Leader pull weight (CA) | 0.35 |
| Large mutation step (CA) / EA step | 1.8 (decays to ~1.1 by gen 150) |
| Small mutation step (CA) | 0.3 |
| Seed | 42 |

No parameters are user-configurable. The goal is to observe the algorithms' behavior, not to tune them.

---

## References

- Reynolds, R. *An Introduction to Cultural Algorithms*. In Proceedings of the 3rd Annual Conference on Evolutionary Programming, 1994, pp. 131–139.
- Liu, W.-Y.; Lin, C.-C. *A Cultural Algorithm for Spatial Forest Harvest Scheduling*. 2014 IEEE Congress on Evolutionary Computation (CEC), Beijing, pp. 1273–1276. *(The original example that motivated this project. That version is more complex and is not implemented here.)*
