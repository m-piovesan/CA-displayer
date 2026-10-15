"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";

import { useSimStore } from "@/lib/store";
import SearchSpaceCanvas from "@/components/SearchSpaceCanvas";
import ComparisonFitnessChart from "@/components/ComparisonFitnessChart";
import SimulationControls from "@/components/SimulationControls";
import { CA_PARAMS } from "@/lib/ca-engine/types";

const TICK_INTERVAL_MS = 120;
const { MAX_GEN } = CA_PARAMS;

export default function ComparePage() {
  const {
    snapshots,
    eaSnapshots,
    currentGen,
    status,
    initialize,
    play,
    pause,
    reset,
    tick,
  } = useSimStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const animate = useCallback(
    (ts: number) => {
      if (ts - lastTickRef.current >= TICK_INTERVAL_MS) {
        lastTickRef.current = ts;
        tick();
      }
      rafRef.current = requestAnimationFrame(animate);
    },
    [tick]
  );

  useEffect(() => {
    if (status === "playing") {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [status, animate]);

  const caSnap = snapshots[currentGen] ?? null;
  const eaSnap = eaSnapshots[currentGen] ?? null;

  if (!caSnap || !eaSnap) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Calculando gerações…</p>
        </div>
      </div>
    );
  }

  const isDone = status === "done";
  const caFinal = caSnap.bestFitness;
  const eaFinal = eaSnap.bestFitness;
  const caWins = caFinal >= eaFinal;
  const advantage = Math.abs(caFinal - eaFinal);

  return (
    <main className="min-h-screen flex flex-col bg-surface relative overflow-hidden">
      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] size-125 rounded-full bg-blue-600/8 blur-[120px]" />
        <div className="absolute bottom-[0%] right-[-5%] size-100 rounded-full bg-amber-600/8 blur-[100px]" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 size-150 rounded-full bg-violet-600/5 blur-[140px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Voltar para a página inicial"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Início
        </Link>

        <h1 className="text-sm font-semibold text-slate-300 tracking-wide">
          CA vs EA — Comparação
        </h1>

        <Link
          href="/demo"
          className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          Ver CA isolado →
        </Link>
      </header>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col gap-4 p-4 md:p-6 max-w-7xl mx-auto w-full">

        {/* Title + advantage badge */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Mesma função · mesma semente · mesma população inicial</p>
            <p className="text-slate-400 text-sm max-w-xl">
              O único fator diferente é a presença do <strong className="text-blue-400">Espaço de Crenças</strong> no CA.
              O EA usa apenas mutação gaussiana pura, sem memória adaptativa.
            </p>
          </div>

          {isDone && (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${
                caWins
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-400"
              }`}
            >
              {caWins ? "🏆 CA venceu" : "⚡ EA venceu"}
              <span className="text-xs font-normal opacity-70">
                Δ {advantage.toFixed(4)}
              </span>
            </div>
          )}
        </div>

        {/* Split canvas row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* CA panel */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-sm font-semibold text-blue-300">Algoritmo Cultural (CA)</span>
              </div>
              <span className="text-xs font-mono text-green-400 tabular-nums">
                Best: {caFinal.toFixed(4)}
              </span>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
              <LegendItem color="#fbbf24" label="Líder" shape="star" />
              <LegendItem color="#3b82f6" label="Normativo" shape="rect" />
              <LegendItem color="#22d3ee" label="Indivíduos" shape="circle" />
            </div>

            <div className="glass p-1 glow-blue">
              <SearchSpaceCanvas snapshot={caSnap} />
            </div>

            <BeliefSpaceInfo snap={caSnap} />
          </div>

          {/* EA panel */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-sm font-semibold text-amber-300">Algoritmo Evolutivo (EA)</span>
              </div>
              <span className="text-xs font-mono text-amber-400 tabular-nums">
                Best: {eaFinal.toFixed(4)}
              </span>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
              <LegendItem color="#fbbf24" label="Melhor" shape="star" />
              <LegendItem color="rgba(255,255,255,0.15)" label="Domínio (sem faixa normativa)" shape="rect" />
              <LegendItem color="#22d3ee" label="Indivíduos" shape="circle" />
            </div>

            <div
              className="glass p-1"
              style={{ boxShadow: "0 0 40px rgba(245,158,11,0.18), 0 0 80px rgba(245,158,11,0.08)" }}
            >
              <SearchSpaceCanvas snapshot={eaSnap} />
            </div>

            <EAInfo snap={eaSnap} />
          </div>
        </div>

        {/* Shared controls + chart */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
          {/* Chart */}
          <div className="glass p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-300">Convergência Comparativa</h2>
                <span className="text-xs text-slate-600">por geração</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-green-400">
                  <span className="w-4 h-0.5 bg-green-500 rounded-full inline-block" />
                  CA best
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-4 h-0.5 bg-amber-500 rounded-full inline-block" />
                  EA best
                </span>
              </div>
            </div>
            <ComparisonFitnessChart
              caSnapshots={snapshots}
              eaSnapshots={eaSnapshots}
              currentGen={currentGen}
            />
          </div>

          {/* Controls */}
          <div className="glass p-4 flex flex-col gap-4 justify-between">
            <SimulationControls
              generation={currentGen}
              bestFitness={caSnap.bestFitness}
              status={status}
              onPlay={play}
              onPause={pause}
              onReset={reset}
            />

            <hr className="border-white/6" />

            {/* Live delta */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs uppercase tracking-widest text-slate-500 font-medium">
                Diferença nesta geração
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <StatItem label="CA best" value={caSnap.bestFitness.toFixed(4)} color="text-green-400" />
                <StatItem label="EA best" value={eaSnap.bestFitness.toFixed(4)} color="text-amber-400" />
                <StatItem label="CA avg" value={caSnap.avgFitness.toFixed(4)} color="text-green-300" />
                <StatItem label="EA avg" value={eaSnap.avgFitness.toFixed(4)} color="text-amber-300" />
              </div>

              <div
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold ${
                  caSnap.bestFitness >= eaSnap.bestFitness
                    ? "bg-green-500/10 text-green-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}
              >
                <span>Vantagem CA</span>
                <span className="font-mono tabular-nums">
                  {caSnap.bestFitness >= eaSnap.bestFitness ? "+" : ""}
                  {(caSnap.bestFitness - eaSnap.bestFitness).toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BeliefSpaceInfo({ snap }: { snap: ReturnType<typeof useSimStore.getState>["snapshots"][0] }) {
  const { leader, normativeRange } = snap.beliefSpace;
  return (
    <div className="glass p-3 grid grid-cols-2 gap-2">
      <InfoCell label="Líder x" value={leader.x.toFixed(3)} />
      <InfoCell label="Líder y" value={leader.y.toFixed(3)} />
      <InfoCell label="Fitness líder" value={leader.fitness.toFixed(4)} highlight />
      <InfoCell label="Média geração" value={snap.avgFitness.toFixed(4)} />
      <InfoCell
        label="Normativo x"
        value={`[${normativeRange.x[0].toFixed(1)}, ${normativeRange.x[1].toFixed(1)}]`}
      />
      <InfoCell
        label="Normativo y"
        value={`[${normativeRange.y[0].toFixed(1)}, ${normativeRange.y[1].toFixed(1)}]`}
      />
    </div>
  );
}

function EAInfo({ snap }: { snap: ReturnType<typeof useSimStore.getState>["eaSnapshots"][0] }) {
  const { leader } = snap.beliefSpace;
  return (
    <div className="glass p-3 grid grid-cols-2 gap-2">
      <InfoCell label="Melhor x" value={leader.x.toFixed(3)} />
      <InfoCell label="Melhor y" value={leader.y.toFixed(3)} />
      <InfoCell label="Melhor fitness" value={leader.fitness.toFixed(4)} highlight color="text-amber-400" />
      <InfoCell label="Média geração" value={snap.avgFitness.toFixed(4)} />
      <InfoCell label="Sem normativo" value="[-10, 10]" dim />
      <InfoCell label="Pior fitness" value={snap.worstFitness.toFixed(4)} dim />
    </div>
  );
}

function InfoCell({
  label,
  value,
  highlight = false,
  color = "text-green-400",
  dim = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  color?: string;
  dim?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-slate-600 font-medium">{label}</span>
      <span
        className={`text-sm font-mono font-semibold tabular-nums ${
          dim ? "text-slate-600" : highlight ? color : "text-slate-200"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function StatItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-slate-600 font-medium">{label}</span>
      <span className={`text-sm font-mono font-semibold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

function LegendItem({
  color,
  label,
  shape,
}: {
  color: string;
  label: string;
  shape: "star" | "rect" | "circle" | "cross";
}) {
  return (
    <span className="flex items-center gap-1.5">
      {shape === "circle" && (
        <span className="w-3 h-3 rounded-full border border-black/30" style={{ background: color }} />
      )}
      {shape === "rect" && (
        <span className="w-4 h-3 rounded-sm border-2" style={{ borderColor: color, background: "transparent" }} />
      )}
      {shape === "star" && (
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <path
            d="M6 0.5l1.4 2.8 3.1 0.45-2.25 2.2 0.53 3.1L6 7.5l-2.78 1.55 0.53-3.1L1.5 3.75l3.1-.45z"
            fill={color}
          />
        </svg>
      )}
      {shape === "cross" && (
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
          <line x1="0" y1="6" x2="12" y2="6" stroke={color} strokeWidth="1.5" />
          <line x1="6" y1="0" x2="6" y2="12" stroke={color} strokeWidth="1.5" />
        </svg>
      )}
      {label}
    </span>
  );
}
