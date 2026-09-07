"use client";

import { CA_PARAMS } from "@/lib/ca-engine/types";

interface Props {
  generation: number;
  bestFitness: number;
  status: "idle" | "playing" | "paused" | "done";
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
}

const { MAX_GEN } = CA_PARAMS;

export default function SimulationControls({
  generation,
  bestFitness,
  status,
  onPlay,
  onPause,
  onReset,
}: Props) {
  const isPlaying = status === "playing";
  const isDone = status === "done";
  const progress = (generation / MAX_GEN) * 100;

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="relative h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-200"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={generation}
          aria-valuemin={0}
          aria-valuemax={MAX_GEN}
          aria-label="Simulation progress"
        />
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-400">
            Generation{" "}
            <span className="font-semibold text-white tabular-nums">
              {generation}
            </span>
            <span className="text-slate-500"> / {MAX_GEN}</span>
          </span>
          <span className="text-slate-400">
            Best fitness{" "}
            <span className="font-semibold text-green-400 tabular-nums">
              {bestFitness.toFixed(4)}
            </span>
          </span>
          {isDone && (
            <span className="text-xs font-medium text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded-full">
              Converged
            </span>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2" role="group" aria-label="Simulation controls">
          {/* Play / Pause */}
          <button
            id="btn-play-pause"
            onClick={isPlaying ? onPause : onPlay}
            disabled={isDone}
            aria-label={isPlaying ? "Pause simulation" : "Play simulation"}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
              bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-40
              disabled:cursor-not-allowed transition-all duration-150 text-white"
          >
            {isPlaying ? (
              <>
                <PauseIcon />
                Pause
              </>
            ) : (
              <>
                <PlayIcon />
                Play
              </>
            )}
          </button>

          {/* Reset */}
          <button
            id="btn-reset"
            onClick={onReset}
            aria-label="Reset simulation to generation 0"
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
              bg-white/10 hover:bg-white/20 active:scale-95
              transition-all duration-150 text-slate-200"
          >
            <ResetIcon />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
      <path d="M2 1.5l10 5.5-10 5.5V1.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
      <rect x="2" y="1" width="4" height="12" rx="1" />
      <rect x="8" y="1" width="4" height="12" rx="1" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M1.5 7A5.5 5.5 0 1 0 4 2.5" strokeLinecap="round" />
      <path d="M1.5 2v3.5H5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
