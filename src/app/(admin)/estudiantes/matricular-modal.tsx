"use client";

import { useEffect, useState } from "react";
import { NuevoEstudianteForm } from "./nuevo/form";

type Sede = { id: string; nombre: string };
type Grupo = { id: string; nombre: string; modalidad: string; sedeId: string };
type Carrera = { id: string; nombre: string };

export function MatricularEstudianteModal({
  sedes,
  grupos,
  carreras,
}: {
  sedes: Sede[];
  grupos: Grupo[];
  carreras: Carrera[];
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
        Matricular estudiante
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Matricular estudiante"
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-4xl flex-col gap-4 overflow-y-auto rounded-lg bg-surface p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Matricular estudiante</h2>
                <p className="text-xs text-ink-soft">
                  La fecha de fin se calcula sola: 1 mes exacto desde la fecha de ingreso.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
                className="rounded-md px-2 py-1 text-ink-soft hover:bg-bg hover:text-ink"
              >
                ✕
              </button>
            </div>
            <NuevoEstudianteForm
              sedes={sedes}
              grupos={grupos}
              carreras={carreras}
              onCreada={() => setAbierto(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
