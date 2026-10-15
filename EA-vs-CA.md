# EA vs CA — Algoritmo Evolutivo vs Algoritmo Cultural

> Documentação da funcionalidade de comparação adicionada ao **CA-displayer**.  
> Projeto: Computação Bio-Inspirada · UFPR

---

## Sumário

1. [Contexto — Por que comparar?](#1-contexto--por-que-comparar)
2. [O Algoritmo Evolutivo (EA) — Como funciona](#2-o-algoritmo-evolutivo-ea--como-funciona)
3. [Diferenças entre EA e CA](#3-diferenças-entre-ea-e-ca)
4. [Por que o CA tende a convergir melhor?](#4-por-que-o-ca-tende-a-convergir-melhor)
5. [Mapa de Arquivos — Módulo EA](#5-mapa-de-arquivos--módulo-ea)
6. [Pseudocódigo do EA](#6-pseudocódigo-do-ea)
7. [Parâmetros compartilhados](#7-parâmetros-compartilhados)
8. [Interpretando a visualização](#8-interpretando-a-visualização)

---

## 1. Contexto — Por que comparar?

O **Algoritmo Cultural (CA)** é uma extensão de um algoritmo evolutivo tradicional. Para evidenciar a vantagem que o *espaço de crenças* traz, precisamos de um **baseline** que resolva exatamente o mesmo problema com as mesmas condições, mas **sem** esse mecanismo de memória adaptativa.

Esse baseline é o **Algoritmo Evolutivo (EA)** simples implementado em `src/lib/ea-engine/runEA.ts`.

A comparação é **cientificamente controlada**: mesma função objetivo, mesma semente aleatória, mesma população inicial, mesmo número de gerações, mesmo tamanho de passo inicial. A única variável independente é a presença ou ausência do espaço de crenças.

---

## 2. O Algoritmo Evolutivo (EA) — Como funciona

O EA implementado é um algoritmo de busca evolutiva com **mutação gaussiana pura** — sem cruzamento, sem seleção por torneio, sem operadores culturais.

### 2.1 Inicialização (idêntica ao CA)

```
POP_SIZE = 30 indivíduos
Domínio: [-10, 10] × [-10, 10]
Semente PRNG: 42 (Mulberry32)

Para i = 1..30:
  P[i].x = -10 + rng() × 20
  P[i].y = -10 + rng() × 20
  P[i].fitness = f(P[i].x, P[i].y)
```

Como a semente é idêntica à do CA, a **geração 0 é pixel-perfect igual** em ambos os algoritmos. Qualquer diferença de desempenho emerge exclusivamente das gerações seguintes.

### 2.2 Loop Evolutivo

```
Para gen = 1..150:

  step = 1.8 × (1 - 0.4 × gen/150)     ← mesmo decaimento linear do CA

  Para cada indivíduo I em P:
    gaussX = BoxMuller(rng)              ← N(0,1)
    gaussY = BoxMuller(rng)
    I'.x = clamp(I.x + step × gaussX)
    I'.y = clamp(I.y + step × gaussY)
    I'.fitness = f(I'.x, I'.y)

  P ← P'
```

Cada indivíduo sofre uma **perturbação gaussiana isotrópica** de desvio padrão `step`. Não há:
- Atração em direção a nenhum líder
- Distinção entre "dentro" e "fora" de alguma região de interesse
- Qualquer forma de memória ou conhecimento acumulado

### 2.3 Decaimento do Passo

O passo `step` começa em **1.8** e decresce linearmente até **1.08** na geração 150:

```
step(gen) = 1.8 × (1 - 0.4 × gen/150)
step(0)   = 1.80
step(75)  = 1.44
step(150) = 1.08
```

Esse decaimento favorece exploração ampla no início e refinamento ao final — mesmo princípio usado no CA para permitir uma comparação justa do tamanho de passo efetivo.

---

## 3. Diferenças entre EA e CA

| Aspecto | EA (simples) | CA (cultural) |
|---|---|---|
| **Estrutura de memória** | Nenhuma | Espaço de Crenças (líder + intervalo normativo) |
| **Mutação** | Gaussiana pura, isotrópica | Adaptativa: normativa (80%) + situacional (20%) |
| **Tamanho do passo** | Único para todos os indivíduos | Pequeno (`0.3`) dentro do normativo, grande fora |
| **Viés de direção** | Nenhum | 20% da pop. é atraída para o líder (`LEADER_PULL = 0.35`) |
| **Conhecimento de regiões de qualidade** | Não | Sim — intervalo normativo delimita a região acima da média |
| **Convergência esperada** | Mais lenta, menos focada | Mais rápida e mais precisa |
| **Exploração vs. exploração** | Balanceada de forma implícita pelo decaimento | Explicitamente dirigida pelo espaço de crenças |
| **Complexidade por geração** | O(n) | O(n) — mesma ordem, custo prático idêntico |

### 3.1 A Influência Situacional (CA exclusivo)

No CA, aproximadamente **20% dos indivíduos** recebem um "impulso" em direção ao melhor indivíduo já observado (líder), com um pouco de ruído gaussiano:

```
novo_x = clamp(x + 0.35 × (líder.x - x) + 0.3 × gaussX)
novo_y = clamp(y + 0.35 × (líder.y - y) + 0.3 × gaussY)
```

No EA, **nenhum indivíduo** tem conhecimento da posição dos outros. Cada um explora de forma independente.

### 3.2 A Influência Normativa (CA exclusivo)

Para os outros **80% dos indivíduos**, o CA distingue:

- **Dentro do intervalo normativo** (região de qualidade): mutação pequena (`σ = 0.3`) — refinamento local.
- **Fora do intervalo normativo**: mutação grande (`σ = largeStep`) + viés de retorno ao centro da região — exploração ampla com direcionamento.

No EA, todos os indivíduos, independente de onde estejam, recebem a mesma perturbação com `σ = step`.

---

## 4. Por que o CA tende a convergir melhor?

### 4.1 Memória Não-Regressiva (Líder)

O líder do espaço de crenças **nunca piora** — ele só é atualizado quando um indivíduo melhor é encontrado. Isso garante que o conhecimento acumulado é sempre uma cota inferior da qualidade máxima já alcançada. O EA não tem essa garantia; a melhor solução encontrada pode ser "esquecida" na próxima geração.

### 4.2 Pressão de Seleção Implícita via Normativo

O intervalo normativo é recalculado a cada geração usando apenas os indivíduos **acima da média de fitness**. Com o tempo, esse intervalo se contrai em direção ao pico da função. Os indivíduos dentro dele recebem passos pequenos (refinamento), enquanto os de fora recebem passos grandes E um viés de retorno — um mecanismo de seleção implícita que o EA não possui.

### 4.3 Exploração e Refinamento Simultâneos

O CA realiza as duas tarefas ao mesmo tempo:
- **Exploração**: 80% da pop. fora do normativo usa passos grandes.
- **Refinamento**: 80% dentro do normativo usa passos pequenos; 20% é atraída diretamente ao líder.

O EA mistura exploração e refinamento com o mesmo passo para todos, sem distinção contextual.

---

## 5. Mapa de Arquivos — Módulo EA

```
src/
├── lib/
│   ├── ea-engine/                   ← Novo módulo (EA)
│   │   └── runEA.ts                 ← Motor do EA: gerador de snapshots
│   └── store.ts                     ← Atualizado: agora pré-computa CA + EA
│
├── app/
│   └── compare/
│       └── page.tsx                 ← Nova página /compare (CA vs EA)
│
└── components/
    └── ComparisonFitnessChart.tsx   ← Novo: gráfico com as duas curvas sobrepostas
```

O módulo EA deliberadamente **reutiliza** os tipos do CA (`Individual`, `GenerationSnapshot`) e a função objetivo (`evaluate`), a semente (`SEED`) e o PRNG (`createRng`). Isso minimiza divergência acidental e isola a variável de estudo.

---

## 6. Pseudocódigo do EA

```
ALGORITMO Evolutivo(POP_SIZE=30, MAX_GEN=150, SEED=42)

  rng ← Mulberry32(SEED)

  // === Inicialização (idêntica ao CA) ===
  PARA i = 1 ATÉ POP_SIZE:
    P[i] = IndivíduoAleatório(rng, domínio=[-10,10] × [-10,10])
    P[i].fitness = gaussiana(P[i].x, P[i].y)

  EMITE snapshot(gen=0, P)

  // === Loop Evolutivo ===
  PARA gen = 1 ATÉ MAX_GEN:

    step ← 1.8 × (1 - 0.4 × gen/MAX_GEN)   // decaimento linear

    PARA CADA indivíduo I em P:
      gaussX ← BoxMuller(rng)                // N(0,1)
      gaussY ← BoxMuller(rng)
      I'.x ← clamp( I.x + step × gaussX )
      I'.y ← clamp( I.y + step × gaussY )
      I'.fitness ← gaussiana(I'.x, I'.y)

    P ← P'

    EMITE snapshot(gen, P)

FIM
```

Compare com o pseudocódigo do CA em `ALGORITMO.md` — a diferença de complexidade conceitual é imensa, enquanto a diferença de custo computacional é nula.

---

## 7. Parâmetros compartilhados

Todos os parâmetros a seguir são idênticos nos dois algoritmos, tornando a comparação controlada:

| Parâmetro | Valor | Compartilhado? |
|---|---|---|
| `POP_SIZE` | `30` | ✅ |
| `MAX_GEN` | `150` | ✅ |
| `DOMAIN_MIN/MAX` | `-10 / 10` | ✅ |
| `PEAK_X/PEAK_Y` | `3 / -4` | ✅ |
| `HILL_S` | `15` | ✅ |
| `STEP_LARGE` (inicial) | `1.8` | ✅ (decaimento idêntico) |
| `SEED` | `42` | ✅ |
| `STEP_SMALL` | `0.3` | ❌ (CA only — dentro do normativo) |
| `LEADER_PULL` | `0.35` | ❌ (CA only — influência situacional) |
| `LEADER_FRACTION` | `0.2` | ❌ (CA only) |
| Espaço de Crenças | — | ❌ (CA only) |

---

## 8. Interpretando a visualização

Na página `/compare` você verá dois canvases lado a lado e um gráfico compartilhado:

### Canvas Esquerdo (CA — azul/violeta)
- O **retângulo tracejado azul** representa o intervalo normativo, que se contrai ao redor do pico com o tempo.
- A **estrela dourada** (líder) persiste na melhor posição já encontrada.
- Os indivíduos convergem de forma organizada, guiados pelo espaço de crenças.

### Canvas Direito (EA — âmbar/laranja)
- **Sem retângulo normativo** (o stub cobre o domínio inteiro — borda branca transparente).
- A **estrela dourada** marca o melhor indivíduo da geração atual (pode regredir entre gerações).
- Os indivíduos exploram de forma mais difusa, sem direcionamento cultural.

### Gráfico de Convergência
- **Linha verde** → CA: melhor fitness por geração.
- **Linha âmbar** → EA: melhor fitness por geração.
- A linha verde deve subir mais rápido e atingir um valor final mais alto.
- A **linha tracejada branca** em y=1.0 representa o ótimo global teórico.

### Badge de Vantagem
Ao final da simulação (geração 150), um badge indica qual algoritmo encontrou a melhor solução e a diferença de fitness (`Δ`). Em condições normais, o CA deve vencer com uma margem mensurável.

---

> **Conclusão:** O Algoritmo Cultural é, na prática, um algoritmo evolutivo com um módulo de memória coletiva. Esse módulo tem custo computacional desprezível, mas impacto significativo na qualidade da busca — exatamente o que a comparação lado a lado demonstra visualmente.
