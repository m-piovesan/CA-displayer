"use client";

import { create } from "zustand";
import { GenerationSnapshot } from "./ca-engine/types";
import { precomputeAllSnapshots } from "./ca-engine/runCA";

type SimStatus = "idle" | "playing" | "paused" | "done";

interface SimStore {
  snapshots: GenerationSnapshot[];
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
  currentGen: 0,
  status: "idle",

  initialize: () => {
    const snapshots = precomputeAllSnapshots();
    set({ snapshots, currentGen: 0, status: "idle" });
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
