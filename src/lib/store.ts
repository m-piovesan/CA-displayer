"use client";

import { create } from "zustand";
import { GenerationSnapshot } from "./ca-engine/types";
import { precomputeAllSnapshots } from "./ca-engine/runCA";
import { precomputeAllEASnapshots } from "./ea-engine/runEA";

type SimStatus = "idle" | "playing" | "paused" | "done";

interface SimStore {
  // ── CA snapshots (original) ──────────────────────────────────────────────
  snapshots: GenerationSnapshot[];
  // ── EA snapshots (new — for comparison) ─────────────────────────────────
  eaSnapshots: GenerationSnapshot[];
  currentGen: number;
  status: SimStatus;
  // actions
  initialize: () => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
}

export const useSimStore = create<SimStore>((set, get) => ({
  snapshots: [],
  eaSnapshots: [],
  currentGen: 0,
  status: "idle",

  initialize: () => {
    const snapshots = precomputeAllSnapshots();
    const eaSnapshots = precomputeAllEASnapshots();
    set({ snapshots, eaSnapshots, currentGen: 0, status: "idle" });
  },

  play: () => {
    const { status, currentGen, snapshots } = get();
    if (status === "done") return;
    if (currentGen >= snapshots.length - 1) {
      set({ status: "done" });
      return;
    }
    set({ status: "playing" });
  },

  pause: () => {
    set({ status: "paused" });
  },

  reset: () => {
    set({ currentGen: 0, status: "idle" });
  },

  tick: () => {
    const { currentGen, snapshots } = get();
    const next = currentGen + 1;
    if (next >= snapshots.length) {
      set({ status: "done" });
    } else {
      set({ currentGen: next });
    }
  },
}));
