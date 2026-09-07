# CA Displayer

An interactive visualization of a **Cultural Algorithm (CA)** applied to continuous 2D function optimization — watch a population of candidate solutions converge toward the peak of a Gaussian hill, guided by a shared *belief space*.

Built with Next.js, TypeScript and Tailwind CSS. No configuration required — just Play, Pause and Reset.

---

## What is a Cultural Algorithm?

A Cultural Algorithm is an evolutionary computation technique proposed by Robert Reynolds (1994). Unlike a standard evolutionary algorithm that only maintains a **population** of candidate solutions, a CA also maintains a **belief space** — a repository of *collective knowledge* extracted from the best individuals of each generation.

This belief space feeds back into the search process, influencing how the population evolves. The key idea is that the group learns from its own experience and uses that knowledge to guide future exploration.

### The Belief Space

This implementation uses two types of knowledge:

- **Situational knowledge** — the *leader*: the single best individual ever found across all generations. It never gets worse. A fraction of the population (20%) is pulled directly toward the leader each generation.

- **Normative knowledge** — the *normative range*: a bounding box (one interval per dimension, x and y) calculated from all individuals whose fitness is above the current generation's average. As the population converges, this rectangle visibly shrinks toward the peak.

### Adaptive Mutation

Each individual is mutated every generation. The step size adapts based on the normative range:

- **Outside the normative range** → large step, biased toward the center of the range (exploration)
- **Inside the normative range** → small step (fine-tuning)

This means that scattered individuals are pushed toward the promising region, while already-focused individuals refine their position locally.

### The Objective Function

A fixed Gaussian hill centered at **(3, −4)** in the domain [−10, 10]²:

```
f(x, y) = exp( -((x − 3)² + (y + 4)²) / 15 )
```

The fitness ranges from 0 (far from the peak) to 1.0 (exactly at the peak). The landscape never changes between runs — only the algorithm's behavior changes.

---

## Demo

| Page | Description |
|---|---|
| `/` | Title, brief description, and a link to the simulation |
| `/demo` | The full simulation — heatmap, population dots, normative rectangle, leader star, fitness chart, and belief space readout |

### Visualization elements

| Element | Meaning |
|---|---|
| Heatmap (inferno palette) | The objective function — brighter = closer to peak |
| Colored dots | Individuals in the current generation |
| Dashed blue rectangle | Normative range — the "focused search zone" |
| ★ Gold star | The leader — best individual ever seen |
| White crosshair | The true peak location (3, −4) |
| Fitness chart | Best / average / worst fitness per generation |

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
│   ├── page.tsx              # Home page
│   └── demo/page.tsx         # Simulation page
├── components/
│   ├── SearchSpaceCanvas.tsx  # SVG visualization (heatmap + dots + leader + rect)
│   ├── FitnessChart.tsx       # Recharts line chart (best/avg/worst)
│   ├── SimulationControls.tsx # Play / Pause / Reset + progress bar
│   └── FixedParamsPanel.tsx   # Read-only parameter display
└── lib/
    ├── store.ts               # Zustand simulation state
    └── ca-engine/
        ├── types.ts           # Types and fixed constants
        ├── seededRandom.ts    # Deterministic PRNG (same initial pop every Reset)
        ├── objectiveFunction.ts # Gaussian hill
        ├── beliefSpace.ts     # Leader tracking + normative range update
        ├── mutation.ts        # Adaptive mutation + situational influence
        └── runCA.ts           # Generator function — one snapshot per generation
```

The CA engine is **pure TypeScript with no React dependencies**, making it easy to test or reuse independently.

---

## Fixed Parameters

| Parameter | Value |
|---|---|
| Population size | 30 |
| Generations | 150 |
| Domain | [−10, 10]² |
| Peak | (3, −4) |
| Hill width (s) | 15 |
| Leader pull fraction | 20% |
| Large mutation step | 1.8 (decays to ~1.1 by gen 150) |
| Small mutation step | 0.3 |

No parameters are user-configurable — the goal is to observe the algorithm's behavior, not to tune it.

---

## References

- Reynolds, R. *An Introduction to Cultural Algorithms*. In Proceedings of the 3rd Annual Conference on Evolutionary Programming, 1994, pp. 131–139.
- Liu, W.-Y.; Lin, C.-C. *A Cultural Algorithm for Spatial Forest Harvest Scheduling*. 2014 IEEE Congress on Evolutionary Computation (CEC), Beijing, pp. 1273–1276. *(The original example that motivated this project — a more complex version not implemented here.)*
