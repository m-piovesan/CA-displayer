# Algoritmo Cultural (CA) — Documentação Técnica

> Visualizador interativo de um Algoritmo Cultural aplicado à otimização de função contínua 2D.  
> Projeto: **CA-displayer** · Disciplina: Computação Bio-Inspirada · UFPR

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Mapa de Arquivos](#2-mapa-de-arquivos)
3. [Parâmetros do Algoritmo](#3-parâmetros-do-algoritmo)
4. [Passo a Passo do Algoritmo](#4-passo-a-passo-do-algoritmo)
   - [Passo 0 — Gerador de Números Aleatórios](#passo-0--gerador-de-números-aleatórios-seededrandomts)
   - [Passo 1 — Função Objetivo](#passo-1--função-objetivo-objectivefunctionts)
   - [Passo 2 — Inicialização da População](#passo-2--inicialização-da-população-runcats)
   - [Passo 3 — Espaço de Crenças Inicial](#passo-3--espaço-de-crenças-inicial-beliefspacets)
   - [Passo 4 — Loop Evolutivo](#passo-4--loop-evolutivo-runcats)
   - [Passo 5 — Mutação Adaptativa](#passo-5--mutação-adaptativa-mutationts)
   - [Passo 6 — Atualização do Espaço de Crenças](#passo-6--atualização-do-espaço-de-crenças-beliefspacets)
5. [Camada de Estado e UI](#5-camada-de-estado-e-ui)
6. [Fluxo de Dados Completo](#6-fluxo-de-dados-completo)
7. [Pseudocódigo Consolidado](#7-pseudocódigo-consolidado)
8. [Referências](#8-referências)

---

## 1. Visão Geral

Um **Algoritmo Cultural (CA)** é uma metaheurística bio-inspirada proposta por Reynolds (1994). Ele estende um algoritmo evolutivo tradicional com uma segunda estrutura de memória chamada **Espaço de Crenças** (*Belief Space*), que armazena conhecimento extraído das melhores soluções e o retroalimenta para guiar a busca.

O CA implementado aqui possui **dois componentes principais**:

| Componente | Função |
|---|---|
| **Espaço de População** | 30 indivíduos que exploram o domínio `[-10, 10]²` |
| **Espaço de Crenças** | Mantém o *líder* (melhor solução histórica) e o *intervalo normativo* (bounding box dos indivíduos acima da média) |

O objetivo é **maximizar** uma função gaussiana com pico em `(3, -4)`:

```
f(x, y) = exp( -((x - 3)² + (y + 4)²) / 15 )
```

Valor máximo: `f(3, -4) = 1.0`

---

## 2. Mapa de Arquivos

Abaixo está a relação de cada arquivo com seu papel no algoritmo:

```
src/
├── lib/
│   ├── ca-engine/                   ← Motor do algoritmo (lógica pura, sem UI)
│   │   ├── types.ts                 ← Tipos TypeScript + constantes CA_PARAMS
│   │   ├── seededRandom.ts          ← PRNG determinístico (Mulberry32)
│   │   ├── objectiveFunction.ts     ← Função gaussiana f(x,y) + heatmap
│   │   ├── beliefSpace.ts           ← Init e update do Espaço de Crenças
│   │   ├── mutation.ts              ← Operadores de mutação (normativo + situacional)
│   │   └── runCA.ts                 ← Orquestrador: gerador de snapshots por geração
│   └── store.ts                     ← Estado global Zustand (controle da simulação)
│
├── app/
│   ├── page.tsx                     ← Landing page (intro ao algoritmo)
│   └── demo/
│       └── page.tsx                 ← Página de simulação interativa
│
└── components/
    ├── SearchSpaceCanvas.tsx        ← Visualização SVG do espaço de busca
    ├── FitnessChart.tsx             ← Gráfico de evolução do fitness (Recharts)
    ├── SimulationControls.tsx       ← Botões Play/Pause/Reset + barra de progresso
    └── FixedParamsPanel.tsx         ← Exibe os parâmetros fixos do algoritmo
```

**Dependências entre os módulos do motor:**

```
types.ts
  ↑
  ├── seededRandom.ts
  ├── objectiveFunction.ts
  ├── beliefSpace.ts
  └── mutation.ts (usa objectiveFunction + types)
      ↑
      runCA.ts (orquestra todos acima)
          ↑
          store.ts (consome runCA, expõe estado para a UI)
              ↑
              demo/page.tsx + components/ (camada de visualização)
```

---

## 3. Parâmetros do Algoritmo

Definidos como constantes imutáveis em `src/lib/ca-engine/types.ts`:

| Constante | Valor | Significado |
|---|---|---|
| `POP_SIZE` | `30` | Tamanho da população |
| `MAX_GEN` | `150` | Número máximo de gerações |
| `DOMAIN_MIN / MAX` | `-10 / 10` | Limites do domínio de busca em x e y |
| `LEADER_FRACTION` | `0.2` | Fração da população sob influência situacional (20%) |
| `PEAK_X / PEAK_Y` | `3 / -4` | Coordenadas do pico da função gaussiana |
| `HILL_S` | `15` | Largura da "colina" gaussiana |
| `STEP_LARGE` | `1.8` | Desvio padrão da mutação fora do intervalo normativo |
| `STEP_SMALL` | `0.3` | Desvio padrão da mutação dentro do intervalo normativo |
| `LEADER_PULL` | `0.35` | Peso da atração em direção ao líder (influência situacional) |
| `SEED` | `42` | Semente do PRNG para reprodutibilidade |

---

## 4. Passo a Passo do Algoritmo

---

### Passo 0 — Gerador de Números Aleatórios (`seededRandom.ts`)

Para garantir **reprodutibilidade total**, o algoritmo usa o PRNG **Mulberry32** em vez do `Math.random()` nativo (que não é semeável).

```typescript
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
```

- **Entrada:** semente inteira (`SEED = 42`)
- **Saída:** função que retorna floats em `[0, 1)` a cada chamada
- Todo o restante do algoritmo chama essa função ao invés de `Math.random()`

---

### Passo 1 — Função Objetivo (`objectiveFunction.ts`)

Define a **paisagem de fitness** que o algoritmo tenta escalar. É uma gaussiana 2D:

```
f(x, y) = exp( -((x - cx)² + (y - cy)²) / s )
```

Onde `cx = 3`, `cy = -4`, `s = 15`.

```typescript
export function evaluate(x: number, y: number): number {
  const dx = x - PEAK_X;   // distância ao pico em x
  const dy = y - PEAK_Y;   // distância ao pico em y
  return Math.exp(-(dx * dx + dy * dy) / HILL_S);
}
```

- **Mínimo:** `≈ 0` (pontos distantes do pico)
- **Máximo:** `1.0` (exatamente em `(3, -4)`)

O mesmo arquivo fornece `computeHeatmap()`, que pré-computa uma grade 2D de valores de fitness para o fundo colorido do canvas.

---

### Passo 2 — Inicialização da População (`runCA.ts`)

No início do gerador `runCA()`, cria-se a geração 0 com indivíduos **distribuídos uniformemente e aleatoriamente** no domínio:

```typescript
let population: Individual[] = Array.from({ length: POP_SIZE }, () => {
  const x = DOMAIN_MIN + rng() * range;  // x ∈ [-10, 10]
  const y = DOMAIN_MIN + rng() * range;  // y ∈ [-10, 10]
  return { x, y, fitness: evaluate(x, y) };
});
```

Cada `Individual` é um objeto `{ x, y, fitness }` (definido em `types.ts`).

---

### Passo 3 — Espaço de Crenças Inicial (`beliefSpace.ts`)

Após criar a população inicial, inicializa-se o **Espaço de Crenças** com `initBeliefSpace()`:

```typescript
export function initBeliefSpace(population: Individual[]): BeliefSpace {
  // Líder = indivíduo com maior fitness
  const leader = population.reduce((best, ind) =>
    ind.fitness > best.fitness ? ind : best
  );

  // Intervalo normativo = bounding box de TODA a população inicial
  return {
    leader,
    normativeRange: {
      x: [Math.min(...xValues), Math.max(...xValues)],
      y: [Math.min(...yValues), Math.max(...yValues)],
    },
  };
}
```

O `BeliefSpace` contém:

| Campo | Tipo | Descrição |
|---|---|---|
| `leader` | `Individual` | Melhor indivíduo já visto (nunca piora) |
| `normativeRange.x` | `[min, max]` | Faixa x dos indivíduos acima da média |
| `normativeRange.y` | `[min, max]` | Faixa y dos indivíduos acima da média |

---

### Passo 4 — Loop Evolutivo (`runCA.ts`)

O núcleo do algoritmo é um **gerador JavaScript** que produz um `GenerationSnapshot` por iteração:

```typescript
for (let gen = 1; gen <= MAX_GEN; gen++) {
  // 4a. Decaimento adaptativo do passo grande
  const largeStep = STEP_LARGE * (1 - 0.4 * (gen / MAX_GEN));

  // 4b. Aplica mutação guiada pelo Espaço de Crenças
  population = mutatePopulation(population, beliefSpace, rng, largeStep);

  // 4c. Atualiza o Espaço de Crenças com a nova população
  beliefSpace = updateBeliefSpace(beliefSpace, population);

  // 4d. Emite snapshot da geração atual
  yield { generation: gen, population, beliefSpace, ...stats(population) };
}
```

**Decaimento do passo:** `largeStep` começa em `1.8` e decai linearmente até `1.08` na última geração (`1.8 × (1 - 0.4) = 1.08`). Isso favorece **exploração no início** e **refinamento no final**.

---

### Passo 5 — Mutação Adaptativa (`mutation.ts`)

`mutatePopulation()` produz a próxima geração aplicando **dois tipos de influência**:

#### 5a. Influência Situacional (≈20% da população)

Um subconjunto aleatório de indivíduos é atraído diretamente em direção ao **líder** do Espaço de Crenças, com pequeno ruído gaussiano:

```typescript
newX = clamp(ind.x + LEADER_PULL * (leader.x - ind.x) + STEP_SMALL * gaussX);
newY = clamp(ind.y + LEADER_PULL * (leader.y - ind.y) + STEP_SMALL * gaussY);
```

- `LEADER_PULL = 0.35`: O indivíduo move 35% da distância ao líder + ruído
- Garante que as melhores soluções sejam exploradas com intensidade

#### 5b. Influência Normativa (≈80% da população)

Os demais indivíduos sofrem mutação gaussiana adaptativa via `mutateCoord()`:

```typescript
function mutateCoord(value, range, rng, step): number {
  const inside = value >= lo && value <= hi;
  const sigma = inside ? STEP_SMALL : step;   // passo pequeno ou grande

  // Box-Muller: transforma dois uniformes em um gaussiano
  const gauss = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  let newVal = value + sigma * gauss;

  // Viés extra em direção ao centro do intervalo normativo (se fora)
  if (!inside) {
    const center = (lo + hi) / 2;
    newVal += 0.15 * (center - value);
  }

  return clamp(newVal);
}
```

| Situação | Sigma usado | Efeito |
|---|---|---|
| Dentro do intervalo normativo | `STEP_SMALL = 0.3` | **Refinamento local** — exploração fina |
| Fora do intervalo normativo | `largeStep ≈ 1.8 → 1.08` | **Exploração ampla** + viés de retorno ao centro |

> A transformada **Box-Muller** converte dois números uniformes em um número com distribuição normal `N(0,1)`, simulando ruído gaussiano sem biblioteca externa.

---

### Passo 6 — Atualização do Espaço de Crenças (`beliefSpace.ts`)

Após cada nova geração, `updateBeliefSpace()` refina o conhecimento acumulado:

```typescript
export function updateBeliefSpace(current, population): BeliefSpace {
  // 6a. Atualiza líder (apenas melhora, nunca piora)
  const genBest = population.reduce((best, ind) =>
    ind.fitness > best.fitness ? ind : best
  );
  const leader = genBest.fitness > current.leader.fitness ? genBest : current.leader;

  // 6b. Recalcula intervalo normativo: apenas indivíduos acima da média
  const avgFitness = population.reduce((s, i) => s + i.fitness, 0) / population.length;
  const aboveAvg = population.filter(ind => ind.fitness >= avgFitness);
  const sample = aboveAvg.length > 0 ? aboveAvg : population; // fallback

  // Bounding box dos indivíduos acima da média, clamped ao domínio
  return { leader, normativeRange };
}
```

**Por que filtrar apenas acima da média?**  
O intervalo normativo representa a *região de alta qualidade* do espaço de busca. Ao usar só os indivíduos acima da média, o intervalo se contrai progressivamente em direção ao pico — induzindo convergência.

---

## 5. Camada de Estado e UI

A camada de estado e visualização não participa da lógica do algoritmo, mas é essencial para a simulação interativa:

### `store.ts` — Estado Global (Zustand)

Pré-computa **todos os 151 snapshots** (gerações 0–150) de uma vez e os armazena em memória:

```typescript
initialize: () => {
  const snapshots = precomputeAllSnapshots(); // roda CA completo uma vez
  set({ snapshots, currentGen: 0, status: "idle" });
},
```

A UI simplesmente **indexa** `snapshots[currentGen]` — não há recalculo durante a animação.

### `demo/page.tsx` — Orquestrador da UI

Usa `requestAnimationFrame` para avançar `currentGen` a cada `120ms` (≈8 fps) enquanto `status === "playing"`.

### `SearchSpaceCanvas.tsx` — Canvas SVG

- Renderiza o **heatmap** inferno (80×80 células) como background estático
- Plota os **30 indivíduos** como círculos coloridos (azul→ciano conforme fitness)
- Exibe o **intervalo normativo** como retângulo tracejado azul
- Marca o **líder** com uma estrela dourada
- Marca o **pico real** da função com um crosshair branco

### `FitnessChart.tsx` — Gráfico de Evolução

Exibe três linhas por geração usando Recharts:
- **Best** — melhor fitness da geração
- **Avg** — fitness médio
- **Worst** — pior fitness

---

## 6. Fluxo de Dados Completo

```
seededRandom.ts ──► rng()
                        │
                        ▼
objectiveFunction.ts ──► evaluate(x,y) ──► fitness
                                               │
                        ┌──────────────────────┤
                        │                      │
                        ▼                      ▼
                  runCA.ts ◄──── beliefSpace.ts (init)
                     │
                     │  for gen = 1..150
                     │
                     ├──► mutation.ts ◄── beliefSpace.ts
                     │         │
                     │         └──► nova população
                     │
                     ├──► beliefSpace.ts (update)
                     │
                     └──► yield GenerationSnapshot
                                     │
                                     ▼
                                store.ts (Zustand)
                                snapshots[0..150]
                                     │
                           ┌─────────┴──────────┐
                           │                    │
                           ▼                    ▼
                  SearchSpaceCanvas       FitnessChart
                  (SVG heatmap +          (Recharts:
                   população +             best/avg/worst)
                   líder + range)
```

---

## 7. Pseudocódigo Consolidado

```
ALGORITMO Cultural(POP_SIZE=30, MAX_GEN=150, SEED=42)

  rng ← Mulberry32(SEED)

  // === Inicialização ===
  PARA i = 1 ATÉ POP_SIZE:
    P[i] = IndivíduoAleatório(rng, domínio=[-10,10] x [-10,10])
    P[i].fitness = gaussiana(P[i].x, P[i].y)

  BS.líder  ← melhor(P)
  BS.range  ← boundingBox(P)

  EMITE snapshot(gen=0, P, BS)

  // === Loop Evolutivo ===
  PARA gen = 1 ATÉ MAX_GEN:

    largeStep ← 1.8 × (1 - 0.4 × gen/MAX_GEN)   // decaimento linear

    // Seleciona 20% para influência situacional (Fisher-Yates shuffle)
    selecionados ← sortear(20%, P)

    PARA CADA indivíduo I em P:
      SE I em selecionados:
        // --- Influência Situacional ---
        gaussX, gaussY ← Box-Muller(rng)
        I'.x ← clamp( I.x + 0.35×(BS.líder.x − I.x) + 0.3×gaussX )
        I'.y ← clamp( I.y + 0.35×(BS.líder.y − I.y) + 0.3×gaussY )
      SENÃO:
        // --- Influência Normativa ---
        PARA dim IN {x, y}:
          SE I.dim ∈ BS.range.dim:
            sigma ← 0.3                           // passo pequeno
          SENÃO:
            sigma ← largeStep                     // passo grande
          gauss ← Box-Muller(rng)
          I'.dim ← I.dim + sigma×gauss
          SE I.dim ∉ BS.range.dim:
            I'.dim ← I'.dim + 0.15×(centro(BS.range.dim) − I.dim)
          I'.dim ← clamp(I'.dim)

      I'.fitness ← gaussiana(I'.x, I'.y)

    P ← P'

    // === Atualização do Espaço de Crenças ===
    SE melhor(P).fitness > BS.líder.fitness:
      BS.líder ← melhor(P)

    média ← mean(fitness(P))
    acimaMedia ← filtrar(P, fitness >= média)
    BS.range ← boundingBox(acimaMedia)    // se vazio, usa P inteiro

    EMITE snapshot(gen, P, BS)

FIM
```

---

## 8. Referências

- **Reynolds, R. G. (1994).** "An Introduction to Cultural Algorithms." *Proceedings of the Third Annual Conference on Evolutionary Programming*, pp. 131–139.
- **Reynolds, R. G. (1999).** "Cultural Algorithms: Theory and Applications." *New Ideas in Optimization*, McGraw-Hill.
- **Mulberry32 PRNG:** Tommy Ettinger, domínio público — algoritmo hash de 32 bits rápido e semeável.
- **Box-Muller Transform:** Box, G. E. P. & Muller, M. E. (1958). "A Note on the Generation of Random Normal Deviates." *The Annals of Mathematical Statistics*, 29(2):610–611.
