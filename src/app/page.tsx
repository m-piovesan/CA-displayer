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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute top-[-20%] left-[30%] size-150 rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[20%] size-125 rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[-10%] size-100 rounded-full bg-amber-500/8 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-2xl w-full flex flex-col items-center text-center gap-10">
        <div className="animate-fade-in">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium
            bg-violet-500/15 text-violet-300 border border-violet-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Algoritmo Evolutivo · Visualização Interativa
          </span>
        </div>

        <div className="animate-fade-in delay-100 flex flex-col items-center gap-3">
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight gradient-text">
            Algoritmo Cultural
          </h1>

          <p className="text-xl sm:text-2xl font-light text-slate-300 tracking-wide">
            Otimização de Função Contínua em 2D
          </p>
        </div>

        <p className="animate-fade-in delay-200 text-slate-400 text-base leading-relaxed max-w-lg">
          Um <strong className="text-slate-200">Algoritmo Cultural (CA)</strong> mantém, além da
          população de soluções, um <em>espaço de crenças</em> — um repositório de conhecimento
          extraído das melhores soluções — que retroalimenta e guia a busca evolutiva.
          <br className="hidden sm:block" />
          <br />
          Observe como os indivíduos convergem para o pico de uma função gaussiana,
          guiados pelo líder e pelo intervalo normativo.
        </p>

        <div className="animate-fade-in delay-300">
          <Link
            href="/demo"
            id="btn-ver-simulacao"
            className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl
              bg-linear-to-r from-blue-600 to-violet-600
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
      </div>
    </main>
  );
}

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

