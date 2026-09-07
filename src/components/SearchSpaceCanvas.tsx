"use client";

import React, { useMemo, useRef, useEffect } from "react";
import { GenerationSnapshot, CA_PARAMS } from "@/lib/ca-engine/types";

const { DOMAIN_MIN, DOMAIN_MAX, PEAK_X, PEAK_Y } = CA_PARAMS;
const RANGE = DOMAIN_MAX - DOMAIN_MIN;
const HEATMAP_RES = 80; // grid cells per side

// ─── Color utilities ─────────────────────────────────────────────────────────

/** Map a fitness value [0,1] to a CSS rgba color using a warm inferno-like palette. */
function fitnessToHeatColor(t: number): string {
  // Inferno-inspired stops: black → purple → red → orange → yellow → white
  const stops: Array<[number, number, number]> = [
    [8, 3, 25],
    [60, 9, 108],
    [150, 23, 96],
    [220, 72, 35],
    [249, 149, 10],
    [252, 235, 140],
  ];
  const n = stops.length - 1;
  const idx = Math.min(n - 1, Math.floor(t * n));
  const frac = t * n - idx;
  const [r1, g1, b1] = stops[idx];
  const [r2, g2, b2] = stops[idx + 1];
  const r = Math.round(r1 + (r2 - r1) * frac);
  const g = Math.round(g1 + (g2 - g1) * frac);
  const b = Math.round(b1 + (b2 - b1) * frac);
  return `rgb(${r},${g},${b})`;
}

/** Map a fitness value to a dot color: blue (low) → cyan → green (high). */
function dotColor(t: number): string {
  const r = Math.round(30 + 20 * t);
  const g = Math.round(140 + 115 * t);
  const b = Math.round(255 - 100 * t);
  return `rgb(${r},${g},${b})`;
}

// ─── Pre-computed heatmap cells ───────────────────────────────────────────────

interface HeatCell {
  x: number;
  y: number;
  fill: string;
}

function buildHeatmapCells(svgSize: number): HeatCell[] {
  const cellSize = svgSize / HEATMAP_RES;
  const cells: HeatCell[] = [];
  for (let row = 0; row < HEATMAP_RES; row++) {
    for (let col = 0; col < HEATMAP_RES; col++) {
      // Convert grid cell center to domain coords
      const domainX = DOMAIN_MIN + (col + 0.5) * (RANGE / HEATMAP_RES);
      const domainY = DOMAIN_MAX - (row + 0.5) * (RANGE / HEATMAP_RES);
      const dx = domainX - PEAK_X;
      const dy = domainY - PEAK_Y;
      const fitness = Math.exp(-(dx * dx + dy * dy) / CA_PARAMS.HILL_S);
      cells.push({
        x: col * cellSize,
        y: row * cellSize,
        fill: fitnessToHeatColor(fitness),
      });
    }
  }
  return cells;
}

// ─── Domain ↔ SVG coordinate helpers ─────────────────────────────────────────

function toSvgX(domainX: number, svgSize: number): number {
  return ((domainX - DOMAIN_MIN) / RANGE) * svgSize;
}

function toSvgY(domainY: number, svgSize: number): number {
  return ((DOMAIN_MAX - domainY) / RANGE) * svgSize;
}

// ─── Star path for the leader marker ─────────────────────────────────────────

function starPath(cx: number, cy: number, r: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.42;
    points.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
  }
  return "M" + points.join("L") + "Z";
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  snapshot: GenerationSnapshot;
  /** Optional CSS class for outer wrapper. */
  className?: string;
}

export default function SearchSpaceCanvas({ snapshot, className = "" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgSize, setSvgSize] = React.useState(500);

  // Observe container size for responsive sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setSvgSize(Math.floor(width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Heatmap cells (depend only on svgSize, not on snapshot)
  const heatCells = useMemo(() => buildHeatmapCells(svgSize), [svgSize]);
  const cellSize = svgSize / HEATMAP_RES;

  const { population, beliefSpace } = snapshot;
  const { leader, normativeRange } = beliefSpace;

  // Normative rectangle bounds in SVG coords
  const rectX = toSvgX(normativeRange.x[0], svgSize);
  const rectY = toSvgY(normativeRange.y[1], svgSize); // y[1] = max domain → top in SVG
  const rectW = Math.max(4, toSvgX(normativeRange.x[1], svgSize) - rectX);
  const rectH = Math.max(4, toSvgY(normativeRange.y[0], svgSize) - rectY);

  const leaderSvgX = toSvgX(leader.x, svgSize);
  const leaderSvgY = toSvgY(leader.y, svgSize);

  return (
    <div ref={containerRef} className={`w-full aspect-square ${className}`}>
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        aria-label="Cultural Algorithm search space visualization"
        role="img"
        style={{ display: "block", borderRadius: "0.75rem", overflow: "hidden" }}
      >
        {/* ── Heatmap background ────────────────────────────────────────── */}
        <g aria-hidden="true">
          {heatCells.map((cell, i) => (
            <rect
              key={i}
              x={cell.x}
              y={cell.y}
              width={cellSize + 0.5}
              height={cellSize + 0.5}
              fill={cell.fill}
            />
          ))}
        </g>

        {/* ── Peak crosshair ────────────────────────────────────────────── */}
        {(() => {
          const px = toSvgX(PEAK_X, svgSize);
          const py = toSvgY(PEAK_Y, svgSize);
          return (
            <g aria-label={`Peak at (${PEAK_X}, ${PEAK_Y})`}>
              <line x1={px - 10} y1={py} x2={px + 10} y2={py} stroke="white" strokeWidth={1.5} opacity={0.6} />
              <line x1={px} y1={py - 10} x2={px} y2={py + 10} stroke="white" strokeWidth={1.5} opacity={0.6} />
            </g>
          );
        })()}

        {/* ── Normative range rectangle ─────────────────────────────────── */}
        <rect
          x={rectX}
          y={rectY}
          width={rectW}
          height={rectH}
          fill="rgba(59,130,246,0.08)"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="6 3"
          rx={3}
          aria-label="Normative range (belief space)"
        />

        {/* ── Population dots ───────────────────────────────────────────── */}
        {population.map((ind, i) => (
          <circle
            key={i}
            cx={toSvgX(ind.x, svgSize)}
            cy={toSvgY(ind.y, svgSize)}
            r={5}
            fill={dotColor(ind.fitness)}
            stroke="rgba(0,0,0,0.5)"
            strokeWidth={1}
          />
        ))}

        {/* ── Leader star ───────────────────────────────────────────────── */}
        <g aria-label={`Leader at (${leader.x.toFixed(2)}, ${leader.y.toFixed(2)}), fitness ${leader.fitness.toFixed(4)}`}>
          {/* Glow ring */}
          <circle
            cx={leaderSvgX}
            cy={leaderSvgY}
            r={14}
            fill="rgba(251,191,36,0.2)"
            stroke="rgba(251,191,36,0.5)"
            strokeWidth={1.5}
          />
          {/* Star */}
          <path
            d={starPath(leaderSvgX, leaderSvgY, 10)}
            fill="#fbbf24"
            stroke="#78350f"
            strokeWidth={1}
          />
        </g>
      </svg>
    </div>
  );
}
