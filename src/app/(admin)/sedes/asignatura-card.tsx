"use client";

import { useEffect, useState } from "react";
import { aplicarDocenteACursos } from "./actions";
import { DocenteAsignaturaSelect, type DocenteOpcion } from "./asignatura-forms";

type Dictado = { grupoNombre: string; docenteId: string; docenteNombre: string };
type Asignatura = {
  id: string;
  nombre: string;
  sedeId: string;
  docenteId: string | null;
  docenteNombre: string | null;
  dictados: Dictado[];
};

export function AsignaturaCard({
  asignatura,
  docentes,
}: {
  asignatura: Asignatura;
  docentes: DocenteOpcion[];
}) {
  const [abierto, setAbierto] = useState(false);
  const hayCursosConOtroDocente =
    !!asignatura.docenteId && asignatura.dictados.some((d) => d.docenteId !== asignatura.docenteId);

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
        className="flex w-full flex-col gap-2 surface-card p-4 text-left hover:-translate-y-0.5 hover:border-brand-blue hover:shadow-md"
      >
        <span className="font-medium text-ink">{asignatura.nombre}</span>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="rounded-full bg-brand-blue-light/20 px-2.5 py-0.5 font-medium text-brand-blue">
            {asignatura.docenteNombre ?? "Sin docente predeterminado"}
          </span>
          <span className="rounded-full bg-line px-2.5 py-0.5 font-mono-tab font-medium text-ink-soft">
            {asignatura.dictados.length} grupo{asignatura.dictados.length === 1 ? "" : "s"}
          </span>
        </div>
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={asignatura.nombre}
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-md flex-col gap-4 rounded-lg bg-surface p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-ink">{asignatura.nombre}</h2>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
                className="rounded-md px-2 py-1 text-ink-soft hover:bg-bg hover:text-ink"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-1.5 border-t border-line pt-4 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Docente predeterminado
              </span>
              <DocenteAsignaturaSelect
                asignaturaId={asignatura.id}
                sedeId={asignatura.sedeId}
                docenteIdActual={asignatura.docenteId}
                docentes={docentes}
              />
            </div>

            <div className="border-t border-line pt-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">
                Grupos a los que se asignó
              </h3>
              <ul className="flex flex-col divide-y divide-line text-sm">
                {asignatura.dictados.map((d, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 py-1.5">
                    <span className="font-medium text-ink">{d.grupoNombre}</span>
                    <span className="text-xs text-ink-soft">{d.docenteNombre}</span>
                  </li>
                ))}
                {!asignatura.dictados.length && (
                  <li className="py-1.5 text-xs italic text-ink-soft">
                    Todavía no se asignó a ningún grupo.
                  </li>
                )}
              </ul>
              {hayCursosConOtroDocente && (
                <form action={aplicarDocenteACursos} className="mt-2">
                  <input type="hidden" name="asignatura_id" value={asignatura.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium text-brand-blue underline decoration-dotted hover:decoration-solid"
                  >
                    Aplicar el docente predeterminado a estos cursos
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
