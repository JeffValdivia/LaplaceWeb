"use client";

import { useState, type ReactNode } from "react";
import { temaPorSede } from "@/lib/tema-sede";

export function SedeDesplegable({
  sedeNombre,
  conteo,
  children,
}: {
  sedeNombre: string;
  conteo: number;
  children: ReactNode;
}) {
  const [abierta, setAbierta] = useState(false);
  const tema = temaPorSede[sedeNombre];

  return (
    <section className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        aria-expanded={abierta}
        className={`flex items-center justify-between gap-3 rounded-lg border bg-surface px-5 py-3.5 text-left transition ${
          abierta && tema ? tema.tarjeta : "border-line hover:border-brand-blue"
        }`}
      >
        <span className="text-sm font-semibold uppercase tracking-wide text-ink">{sedeNombre}</span>
        <span className="flex items-center gap-2 text-xs text-ink-soft">
          {conteo} asignatura{conteo === 1 ? "" : "s"}
          <span className={`inline-block transition-transform ${abierta ? "rotate-180" : ""}`}>
            ⌄
          </span>
        </span>
      </button>

      {abierta && <div className="flex flex-col gap-5">{children}</div>}
    </section>
  );
}
