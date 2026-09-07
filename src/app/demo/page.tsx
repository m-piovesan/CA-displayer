"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import type { Metadata } from "next";

import { useSimStore } from "@/lib/store";
import SearchSpaceCanvas from "@/components/SearchSpaceCanvas";
import FitnessChart from "@/components/FitnessChart";
import SimulationControls from "@/components/SimulationControls";
import FixedParamsPanel from "@/components/FixedParamsPanel";

/** Milliseconds between animation frames (≈ 8 fps for a clear visual step). */
const TICK_INTERVAL_MS = 120;

export default function DemoPage() {
  const { snapshots, currentGen, status, initialize, play, pause, reset, tick } =
    useSimStore();

  // ── Initialize once on mount ──────────────────────────────────────────────
  useEffect(() => {
    initialize();
  }, [initialize]);

  // ── Animation loop (requestAnimationFrame + interval) ─────────────────────
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
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [status, animate]);

  // ── Snapshot for current generation ──────────────────────────────────────
  const snapshot = snapshots[currentGen] ?? null;

  if (!snapshot) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Calculando gerações…</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-surface relative overflow-hidden">
      {/* ── Ambient glow ─────────────────────────────────────────────────── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-[120px]" />
        <div className="absolute bottom-[0%] right-[-5%] w-[400px] h-[400px] rounded-full bg-violet-600/8 blur-[100px]" />
      </div>

      {/* ── Top nav ──────────────────────────────────────────────────────── */}
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
          Algoritmo Cultural — Simulação
        </h1>
        <div className="w-16" /> {/* spacer */}
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">

        {/* ── Left: canvas ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Legend row */}
          <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500">
            <LegendItem color="#fbbf24" label="Líder (melhor histórico)" shape="star" />
            <LegendItem color="#3b82f6" label="Intervalo normativo" shape="rect" />
            <LegendItem color="#22d3ee" label="Indivíduos" shape="circle" />
            <LegendItem color="rgba(255,255,255,0.4)" label="Pico da função" shape="cross" />
          </div>

          <div className="glass p-1 glow-blue">
            <SearchSpaceCanvas snapshot={snapshot} />
          </div>
        </div>

        {/* ── Right: controls + chart ───────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Controls panel */}
          <div className="glass p-4 flex flex-col gap-4">
            <FixedParamsPanel />
            <hr className="border-white/6" />
            <SimulationControls
              generation={currentGen}
              bestFitness={snapshot.bestFitness}
              status={status}
              onPlay={play}
              onPause={pause}
              onReset={reset}
            />
          </div>

          {/* Fitness chart */}
          <div className="glass p-4 flex flex-col gap-3 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-300">Evolução do Fitness</h2>
              <span className="text-xs text-slate-600">por geração</span>
            </div>
            <FitnessChart snapshots={snapshots} currentGen={currentGen} />
          </div>

          {/* Belief space info card */}
          <div className="glass p-4 flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-slate-300">Espaço de Crenças</h2>
            <div className="grid grid-cols-2 gap-2">
              <BeliefInfoItem
                label="Líder x"
                value={snapshot.beliefSpace.leader.x.toFixed(3)}
              />
              <BeliefInfoItem
                label="Líder y"
                value={snapshot.beliefSpace.leader.y.toFixed(3)}
              />
              <BeliefInfoItem
                label="Fitness do líder"
                value={snapshot.beliefSpace.leader.fitness.toFixed(4)}
                highlight
              />
              <BeliefInfoItem
                label="Média da geração"
                value={snapshot.avgFitness.toFixed(4)}
              />
              <BeliefInfoItem
                label="Normativo x"
                value={`[${snapshot.beliefSpace.normativeRange.x[0].toFixed(1)}, ${snapshot.beliefSpace.normativeRange.x[1].toFixed(1)}]`}
              />
              <BeliefInfoItem
                label="Normativo y"
                value={`[${snapshot.beliefSpace.normativeRange.y[0].toFixed(1)}, ${snapshot.beliefSpace.normativeRange.y[1].toFixed(1)}]`}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function BeliefInfoItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-slate-600 font-medium">
        {label}
      </span>
      <span
        className={`text-sm font-mono font-semibold tabular-nums ${
          highlight ? "text-green-400" : "text-slate-200"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
