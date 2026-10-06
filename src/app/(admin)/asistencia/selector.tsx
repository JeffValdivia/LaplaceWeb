"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { temaPorSede } from "@/lib/tema-sede";

export type CursoOpcion = { id: string; asignaturaNombre: string; docenteNombre: string };
export type GrupoOpcion = {
  id: string;
  nombre: string;
  modalidad: string;
  sedeId: string;
  cursos: CursoOpcion[];
};
export type SedeOpcion = { id: string; nombre: string };

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

export function SelectorAsistencia({
  sedes,
  grupos,
  cursoActual,
  fecha,
  modalidad,
}: {
  sedes: SedeOpcion[];
  grupos: GrupoOpcion[];
  cursoActual: { sedeNombre: string; grupoNombre: string; asignaturaNombre: string } | null;
  fecha: string;
  modalidad: string;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(!cursoActual);
  const [sedeId, setSedeId] = useState("");
  const [grupoId, setGrupoId] = useState("");

  const gruposDeLaSede = grupos.filter((g) => g.sedeId === sedeId);
  const grupoElegido = grupos.find((g) => g.id === grupoId) ?? null;

  function irAlCurso(cursoId: string) {
    const qs = new URLSearchParams({ curso_id: cursoId, fecha, modalidad });
    router.push(`/asistencia?${qs.toString()}`);
    setEditando(false);
  }

  function elegirGrupo(g: GrupoOpcion) {
    setGrupoId(g.id);
    if (g.cursos.length === 1) {
      irAlCurso(g.cursos[0].id);
    }
  }

  if (!editando && cursoActual) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 surface-card p-4">
        <p className="text-sm text-ink">
          <span className="text-ink-soft">{cursoActual.sedeNombre} · </span>
          <span className="font-medium">{cursoActual.grupoNombre}</span>
          <span className="text-ink-soft"> · {cursoActual.asignaturaNombre}</span>
        </p>
        <button
          type="button"
          onClick={() => {
            setSedeId("");
            setGrupoId("");
            setEditando(true);
          }}
          className="text-sm font-medium text-brand-blue hover:underline"
        >
          Cambiar grupo
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 surface-card p-5">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">1. Elige la sede</h2>
        <div className="mt-2 flex flex-wrap gap-3">
          {sedes.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSedeId(s.id);
                setGrupoId("");
              }}
              className={`rounded-lg border px-5 py-3 text-sm font-medium transition ${
                sedeId === s.id
                  ? "border-brand-blue bg-brand-blue-light/20 text-brand-blue"
                  : "border-line text-ink hover:border-brand-blue hover:text-brand-blue"
              }`}
            >
              {s.nombre}
            </button>
          ))}
        </div>
      </div>

      {sedeId && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">2. Elige el grupo</h2>
          {gruposDeLaSede.length ? (
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {gruposDeLaSede.map((g) => {
                const tema = temaPorSede[sedes.find((s) => s.id === sedeId)?.nombre ?? ""];
                const elegido = grupoId === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => elegirGrupo(g)}
                    className={`flex flex-col gap-1 rounded-lg border bg-bg p-4 text-left transition ${
                      elegido
                        ? "border-brand-blue ring-2 ring-brand-blue-light/40"
                        : tema
                          ? tema.tarjeta
                          : "border-line hover:border-brand-blue"
                    }`}
                  >
                    <span className="text-sm font-medium text-ink">{g.nombre}</span>
                    <span className="text-xs text-ink-soft">
                      {modalidadEtiqueta[g.modalidad] ?? g.modalidad} · {g.cursos.length} curso
                      {g.cursos.length === 1 ? "" : "s"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mt-2 text-sm italic text-ink-soft">Esta sede todavía no tiene grupos.</p>
          )}
        </div>
      )}

      {grupoElegido && grupoElegido.cursos.length > 1 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">3. Elige el curso</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {grupoElegido.cursos.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => irAlCurso(c.id)}
                className="rounded-md border border-line px-3 py-1.5 text-sm text-ink hover:border-brand-blue hover:text-brand-blue"
              >
                {c.asignaturaNombre}{" "}
                <span className="text-xs text-ink-soft">({c.docenteNombre})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {grupoElegido && !grupoElegido.cursos.length && (
        <p className="text-sm italic text-ink-soft">Este grupo todavía no tiene cursos asignados.</p>
      )}
    </div>
  );
}
