"use client";

import { useState, type ReactNode } from "react";
import { DocenteSidebar } from "./sidebar";
import type { GrupoConCursos, CursoNav } from "@/lib/docente-nav";

export function DocenteChrome({
  nombreCompleto,
  grupos,
  cursosSinGrupo,
  cerrarSesion,
  children,
}: {
  nombreCompleto: string;
  grupos: GrupoConCursos[];
  cursosSinGrupo: CursoNav[];
  cerrarSesion: () => void;
  children: ReactNode;
}) {
  const [colapsado, setColapsado] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg">
      <DocenteSidebar colapsado={colapsado} grupos={grupos} cursosSinGrupo={cursosSinGrupo} />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setColapsado((v) => !v)}
              title={colapsado ? "Expandir menú" : "Contraer menú"}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-ink-soft transition-all duration-200 hover:border-brand-blue hover:text-brand-blue"
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-4 w-4 transition-transform duration-300 ${colapsado ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 5 8 12l7 7" />
              </svg>
            </button>
            <div className="text-sm">
              <p className="font-medium text-ink">{nombreCompleto}</p>
              <p className="font-mono-tab text-xs uppercase tracking-wider text-ink-soft">docente</p>
            </div>
          </div>
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="rounded-md bg-danger px-3 py-1.5 text-sm font-medium text-white transition-all duration-200 hover:brightness-110 hover:shadow-md"
            >
              Cerrar sesión
            </button>
          </form>
        </header>
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
