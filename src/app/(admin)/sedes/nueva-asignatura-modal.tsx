"use client";

import { useEffect, useState } from "react";
import { NuevaAsignaturaForm, type DocenteOpcion } from "./asignatura-forms";

type Sede = { id: string; nombre: string };

export function NuevaAsignaturaModal({
  sedes,
  docentes,
}: {
  sedes: Sede[];
  docentes: DocenteOpcion[];
}) {
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-md bg-gradient-to-r from-brand-navy to-brand-blue px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:shadow-lg hover:brightness-110"
      >
        + Nueva asignatura
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Nueva asignatura"
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-sm flex-col gap-4 rounded-lg bg-surface p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-ink">Nueva asignatura</h2>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
                className="rounded-md px-2 py-1 text-ink-soft hover:bg-bg hover:text-ink"
              >
                ✕
              </button>
            </div>
            <NuevaAsignaturaForm sedes={sedes} docentes={docentes} onCreada={() => setAbierto(false)} />
          </div>
        </div>
      )}
    </>
  );
}
