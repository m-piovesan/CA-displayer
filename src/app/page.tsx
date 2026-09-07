import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CA Displayer — Cultural Algorithm Visualizer",
  description:
    "Visualizador interativo de um Algoritmo Cultural aplicado à otimização de função contínua em 2D.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
      {/* ── Background ambient glow ───────────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute top-[-20%] left-[30%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[-10%] w-[400px] h-[400px] rounded-full bg-amber-500/8 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-2xl w-full flex flex-col items-center text-center gap-10">
        {/* ── Badge ─────────────────────────────────────────────────────── */}
        <div className="animate-fade-in">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium
            bg-violet-500/15 text-violet-300 border border-violet-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Algoritmo Evolutivo · Visualização Interativa
          </span>
        </div>

        {/* ── Main heading ──────────────────────────────────────────────── */}
        <div className="animate-fade-in delay-100 flex flex-col items-center gap-3">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight gradient-text">
            Algoritmo Cultural
          </h1>
          <p className="text-xl sm:text-2xl font-light text-slate-300 tracking-wide">
            Otimização de Função Contínua em 2D
          </p>
        </div>

        {/* ── Description ───────────────────────────────────────────────── */}
        <p className="animate-fade-in delay-200 text-slate-400 text-base leading-relaxed max-w-lg">
          Um <strong className="text-slate-200">Algoritmo Cultural (CA)</strong> mantém, além da
          população de soluções, um <em>espaço de crenças</em> — um repositório de conhecimento
          extraído das melhores soluções — que retroalimenta e guia a busca evolutiva.
          <br className="hidden sm:block" />
          <br />
          Observe como os indivíduos convergem para o pico de uma função gaussiana,
          guiados pelo líder e pelo intervalo normativo.
        </p>

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <div className="animate-fade-in delay-300">
          <Link
            href="/demo"
            id="btn-ver-simulacao"
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl
              bg-gradient-to-r from-blue-600 to-violet-600
              hover:from-blue-500 hover:to-violet-500
              text-white font-semibold text-lg
              shadow-lg shadow-blue-900/40
              transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-blue-900/50
              active:scale-100"
          >
            Ver simulação
            <ArrowRightIcon />
          </Link>
        </div>

        {/* ── References ────────────────────────────────────────────────── */}
        <div className="animate-fade-in delay-400 w-full">
          <p className="text-xs font-medium text-slate-600 uppercase tracking-widest mb-4">
            Base Conceitual
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <ReferenceCard
              tag="Conceito Geral"
              authors="Reynolds, R."
              year="1994"
              title="An Introduction to Cultural Algorithms"
              venue="Proc. 3rd Annual Conference on Evolutionary Programming"
              pages="pp. 131–139"
            />
            <ReferenceCard
              tag="Exemplo Original"
              authors="Liu, W.-Y.; Lin, C.-C."
              year="2014"
              title="A Cultural Algorithm for Spatial Forest Harvest Scheduling"
              venue="2014 IEEE CEC, Beijing"
              pages="pp. 1273–1276"
              note="Versão completa, mais complexa — não implementada aqui."
            />
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ArrowRightIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="transition-transform duration-200 group-hover:translate-x-1"
      aria-hidden
    >
      <path d="M4 10h12M10 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface RefProps {
  tag: string;
  authors: string;
  year: string;
  title: string;
  venue: string;
  pages: string;
  note?: string;
}

function ReferenceCard({ tag, authors, year, title, venue, pages, note }: RefProps) {
  return (
    <div className="glass p-4 text-left group hover:bg-white/[0.06] transition-colors duration-200">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider
          px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
          {tag}
        </span>
        <span className="text-xs text-slate-600">{year}</span>
      </div>
      <p className="text-sm font-medium text-slate-200 mb-1 leading-snug">{title}</p>
      <p className="text-xs text-slate-500 mb-0.5">{authors}</p>
      <p className="text-xs text-slate-600">
        {venue} · {pages}
      </p>
      {note && (
        <p className="text-[11px] text-slate-600 italic mt-2 border-t border-white/5 pt-2">
          {note}
        </p>
      )}
    </div>
  );
}
