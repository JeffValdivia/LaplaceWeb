"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { GrupoConCursos } from "@/lib/docente-nav";

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

function diasDesde(fecha: string) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const f = new Date(fecha + "T00:00:00");
  return Math.round((hoy.getTime() - f.getTime()) / (1000 * 60 * 60 * 24));
}

function EtiquetaAvance({ fecha }: { fecha?: string }) {
  if (!fecha) {
    return <span className="text-xs italic text-warn">Sin avance registrado</span>;
  }
  const dias = diasDesde(fecha);
  const texto =
    dias <= 0 ? "Última clase: hoy" : `Última clase: hace ${dias} día${dias === 1 ? "" : "s"}`;
  return (
    <span className={`text-xs ${dias > 7 ? "text-warn" : "text-ink-soft"}`}>{texto}</span>
  );
}

export function GrupoResumenCard({
  grupo,
  cantidadEstudiantes,
  ultimoAvancePorCurso,
  sinGrupo = false,
}: {
  grupo: GrupoConCursos;
  cantidadEstudiantes: number;
  ultimoAvancePorCurso: Map<string, string>;
  sinGrupo?: boolean;
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
        className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-5 text-left transition hover:-translate-y-0.5 hover:border-brand-blue hover:shadow-md"
      >
        <span className="font-medium text-ink">{grupo.grupoNombre}</span>
        <span className="text-xs text-ink-soft">
          {sinGrupo
            ? grupo.sedeNombre
            : `${grupo.sedeNombre} · ${modalidadEtiqueta[grupo.modalidad] ?? grupo.modalidad}`}
        </span>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
          {!sinGrupo && (
            <span className="rounded-full bg-brand-blue-light/20 px-2.5 py-0.5 font-mono-tab font-medium text-brand-blue">
              {cantidadEstudiantes} alumno{cantidadEstudiantes === 1 ? "" : "s"}
            </span>
          )}
          <span className="rounded-full bg-line px-2.5 py-0.5 font-mono-tab font-medium text-ink-soft">
            {grupo.cursos.length} curso{grupo.cursos.length === 1 ? "" : "s"}
          </span>
        </div>
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={grupo.grupoNombre}
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-lg flex-col gap-4 rounded-lg bg-surface p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-ink">{grupo.grupoNombre}</h2>
                <span className="text-xs text-ink-soft">
                  {sinGrupo
                    ? grupo.sedeNombre
                    : `${grupo.sedeNombre} · ${modalidadEtiqueta[grupo.modalidad] ?? grupo.modalidad} · ${cantidadEstudiantes} alumno${cantidadEstudiantes === 1 ? "" : "s"}`}
                </span>
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

            <div className="flex flex-col divide-y divide-line border-t border-line">
              {grupo.cursos.map((c) => (
                <div key={c.cursoId} className="flex flex-col gap-2 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/docente/cursos/${c.cursoId}`}
                      className="font-medium text-ink hover:text-brand-blue"
                    >
                      {c.asignaturaNombre}
                    </Link>
                    <EtiquetaAvance fecha={ultimoAvancePorCurso.get(c.cursoId)} />
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs font-medium">
                    <Link
                      href={`/docente/cursos/${c.cursoId}/recursos`}
                      className="rounded-md border border-line px-2.5 py-1 text-ink-soft hover:border-brand-blue hover:text-brand-blue"
                    >
                      Campus virtual
                    </Link>
                    <Link
                      href={`/docente/cursos/${c.cursoId}/evaluaciones`}
                      className="rounded-md border border-line px-2.5 py-1 text-ink-soft hover:border-brand-blue hover:text-brand-blue"
                    >
                      Evaluaciones
                    </Link>
                    <Link
                      href={`/docente/cursos/${c.cursoId}/asistencia`}
                      className="rounded-md border border-line px-2.5 py-1 text-ink-soft hover:border-brand-blue hover:text-brand-blue"
                    >
                      Asistencia
                    </Link>
                    <Link
                      href={`/docente/cursos/${c.cursoId}/avance`}
                      className="rounded-md border border-line px-2.5 py-1 text-ink-soft hover:border-brand-blue hover:text-brand-blue"
                    >
                      Avance de clase
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {!sinGrupo && (
              <div className="flex flex-wrap gap-2 border-t border-line pt-4 text-sm font-medium">
                <Link
                  href={`/docente/grupos/${grupo.grupoId}`}
                  className="rounded-md bg-brand-navy px-3 py-1.5 text-white hover:bg-brand-blue"
                >
                  Ver grupo completo
                </Link>
                <Link
                  href={`/docente/grupos/${grupo.grupoId}/comunicados`}
                  className="rounded-md border border-line px-3 py-1.5 text-ink hover:border-brand-blue hover:text-brand-blue"
                >
                  Comunicados
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
