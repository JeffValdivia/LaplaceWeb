"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";

export function AdminChrome({
  nombreCompleto,
  rol,
  fechaHoy,
  cerrarSesion,
  children,
}: {
  nombreCompleto: string;
  rol: string;
  fechaHoy: string;
  cerrarSesion: () => void;
  children: ReactNode;
}) {
  const [colapsado, setColapsado] = useState(false);

  return (
    <div className="flex min-h-screen bg-bg print:block print:min-h-0">
      <div className="print:hidden">
        <Sidebar colapsado={colapsado} />
      </div>
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-y-0 right-0 z-0 bg-[url('/brand/log-laplace.png')] bg-center bg-no-repeat opacity-10 transition-[left] duration-300 print:hidden ${
          colapsado ? "left-26" : "left-70"
        }`}
        style={{ backgroundSize: "480px" }}
      />
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-surface/90 px-6 py-3 shadow-sm backdrop-blur-sm print:hidden">
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
            <p className="font-display text-sm font-bold text-ink-soft">{fechaHoy}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-navy to-brand-blue text-sm font-semibold text-white shadow-[0_2px_8px_-2px_rgba(44,75,176,0.5)]">
              {nombreCompleto.charAt(0).toUpperCase()}
            </span>
            <div className="text-sm">
              <p className="font-display font-semibold text-ink">¡Bienvenido, {nombreCompleto}!</p>
              <p className="font-mono-tab text-xs uppercase tracking-wider text-ink-soft">{rol}</p>
            </div>
            <form action={cerrarSesion}>
              <button
                type="submit"
                className="rounded-md bg-danger px-3 py-1.5 text-sm font-medium text-white transition-all duration-200 hover:brightness-110 hover:shadow-md"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </header>
        <main className="relative z-10 flex-1 px-6 py-8 print:p-0">{children}</main>
      </div>
    </div>
  );
}
