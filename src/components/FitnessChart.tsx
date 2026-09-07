"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { GenerationSnapshot } from "@/lib/ca-engine/types";

interface Props {
  snapshots: GenerationSnapshot[];
  currentGen: number;
}

interface ChartPoint {
  gen: number;
  best: number;
  avg: number;
  worst: number;
}

export default function FitnessChart({ snapshots, currentGen }: Props) {
  // Show data only up to (and including) currentGen
  const data: ChartPoint[] = snapshots.slice(0, currentGen + 1).map((s) => ({
    gen: s.generation,
    best: parseFloat(s.bestFitness.toFixed(4)),
    avg: parseFloat(s.avgFitness.toFixed(4)),
    worst: parseFloat(s.worstFitness.toFixed(4)),
  }));

  return (
    <div className="w-full h-48 md:h-56" aria-label="Fitness evolution chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 16, left: -16, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="gen"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            label={{ value: "Generation", position: "insideBottom", offset: -2, fill: "#64748b", fontSize: 11 }}
          />
          <YAxis
            domain={[0, 1]}
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickCount={6}
          />
          <Tooltip
            contentStyle={{
              background: "#1e1e2e",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              fontSize: 12,
              color: "#e2e8f0",
            }}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(value) => (typeof value === 'number' ? value.toFixed(4) : String(value))}
            labelFormatter={(label) => `Gen ${label}`}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 4 }}
          />
          <Line
            type="monotone"
            dataKey="best"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            name="Best"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="avg"
            stroke="#f59e0b"
            strokeWidth={1.5}
            dot={false}
            name="Avg"
            strokeDasharray="4 2"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="worst"
            stroke="#ef4444"
            strokeWidth={1}
            dot={false}
            name="Worst"
            strokeDasharray="2 3"
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
