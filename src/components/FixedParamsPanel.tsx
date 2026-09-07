"use client";

import { CA_PARAMS } from "@/lib/ca-engine/types";

const { POP_SIZE, MAX_GEN, PEAK_X, PEAK_Y, HILL_S, LEADER_FRACTION, STEP_LARGE, STEP_SMALL } = CA_PARAMS;

const PARAMS = [
  { label: "Population", value: POP_SIZE },
  { label: "Generations", value: MAX_GEN },
  { label: "Peak", value: `(${PEAK_X}, ${PEAK_Y})` },
  { label: "Hill width s", value: HILL_S },
  { label: "Leader fraction", value: `${(LEADER_FRACTION * 100).toFixed(0)}%` },
  { label: "Step large / small", value: `${STEP_LARGE} / ${STEP_SMALL}` },
];

export default function FixedParamsPanel() {
  return (
    <div
      role="region"
      aria-label="Fixed algorithm parameters"
      className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-slate-500"
    >
      {PARAMS.map(({ label, value }) => (
        <span key={label}>
          <span className="text-slate-600">{label}: </span>
          <span className="text-slate-400 font-medium">{value}</span>
        </span>
      ))}
    </div>
  );
}
