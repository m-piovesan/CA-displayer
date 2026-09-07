import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CA Displayer — Cultural Algorithm Visualizer",
  description:
    "Interactive visualization of a Cultural Algorithm optimizing a continuous 2D function. Watch how the belief space guides the population toward the hill peak.",
  keywords: ["cultural algorithm", "evolutionary computation", "optimization", "visualization"],
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="bg-surface text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
