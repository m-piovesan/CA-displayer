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
  ReferenceLine,
} from "recharts";
import { GenerationSnapshot } from "@/lib/ca-engine/types";

interface Props {
  caSnapshots: GenerationSnapshot[];
  eaSnapshots: GenerationSnapshot[];
  currentGen: number;
}

interface ChartPoint {
  gen: number;
  caBest: number;
  caAvg: number;
  eaBest: number;
  eaAvg: number;
}

export default function ComparisonFitnessChart({
  caSnapshots,
  eaSnapshots,
  currentGen,
}: Props) {
  const len = Math.min(
    caSnapshots.length,
    eaSnapshots.length,
    currentGen + 1
  );

  const data: ChartPoint[] = Array.from({ length: len }, (_, i) => ({
    gen: caSnapshots[i].generation,
    caBest: parseFloat(caSnapshots[i].bestFitness.toFixed(4)),
    caAvg: parseFloat(caSnapshots[i].avgFitness.toFixed(4)),
    eaBest: parseFloat(eaSnapshots[i].bestFitness.toFixed(4)),
    eaAvg: parseFloat(eaSnapshots[i].avgFitness.toFixed(4)),
  }));

  return (
    <div className="w-full h-52 md:h-64" aria-label="CA vs EA fitness comparison chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />

          <XAxis
            dataKey="gen"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            label={{
              value: "Generation",
              position: "insideBottom",
              offset: -2,
              fill: "#64748b",
              fontSize: 11,
            }}
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
            formatter={(value, name) => {
              const label =
                name === "caBest"
                  ? "CA Best"
                  : name === "caAvg"
                  ? "CA Avg"
                  : name === "eaBest"
                  ? "EA Best"
                  : "EA Avg";
              return [
                typeof value === "number" ? value.toFixed(4) : String(value),
                label,
              ];
            }}
            labelFormatter={(label) => `Gen ${label}`}
          />

          <Legend
            wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 4 }}
            formatter={(value) => {
              const map: Record<string, string> = {
                caBest: "CA — Best",
                caAvg: "CA — Avg",
                eaBest: "EA — Best",
                eaAvg: "EA — Avg",
              };
              return map[value] ?? value;
            }}
          />

          {/* CA lines — blue/green family */}
          <Line
            type="monotone"
            dataKey="caBest"
            stroke="#22c55e"
            strokeWidth={2.5}
            dot={false}
            name="caBest"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="caAvg"
            stroke="#4ade80"
            strokeWidth={1.5}
            dot={false}
            name="caAvg"
            strokeDasharray="4 2"
            isAnimationActive={false}
          />

          {/* EA lines — amber/orange family */}
          <Line
            type="monotone"
            dataKey="eaBest"
            stroke="#f59e0b"
            strokeWidth={2.5}
            dot={false}
            name="eaBest"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="eaAvg"
            stroke="#fbbf24"
            strokeWidth={1.5}
            dot={false}
            name="eaAvg"
            strokeDasharray="4 2"
            isAnimationActive={false}
          />

          {/* Theoretical maximum */}
          <ReferenceLine
            y={1}
            stroke="rgba(255,255,255,0.2)"
            strokeDasharray="6 3"
            label={{ value: "max", fill: "#475569", fontSize: 10, position: "right" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
