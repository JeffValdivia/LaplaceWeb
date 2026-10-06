"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { temaPorSede } from "@/lib/tema-sede";

export type GrupoOpcion = {
  id: string;
  nombre: string;
  modalidad: string;
  sedeId: string;
  totalAlumnos: number;
};
export type SedeOpcion = { id: string; nombre: string };

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

export function SelectorReportes({
  sedes,
  grupos,
  grupoActual,
}: {
  sedes: SedeOpcion[];
  grupos: GrupoOpcion[];
  grupoActual: { sedeNombre: string; grupoNombre: string } | null;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(!grupoActual);
  const [sedeId, setSedeId] = useState("");

  const gruposDeLaSede = grupos.filter((g) => g.sedeId === sedeId);

  function elegirGrupo(g: GrupoOpcion) {
    router.push(`/reportes?grupo_id=${g.id}`);
    setEditando(false);
  }

  if (!editando && grupoActual) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 surface-card p-4 print:hidden">
        <p className="text-sm text-ink">
          <span className="text-ink-soft">{grupoActual.sedeNombre} · </span>
          <span className="font-medium">{grupoActual.grupoNombre}</span>
        </p>
        <button
          type="button"
          onClick={() => {
            setSedeId("");
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
    <div className="flex flex-col gap-4 surface-card p-5 print:hidden">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">1. Elige la sede</h2>
        <div className="mt-2 flex flex-wrap gap-3">
          {sedes.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSedeId(s.id)}
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
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => elegirGrupo(g)}
                    className={`flex flex-col gap-1 rounded-lg border bg-bg p-4 text-left transition ${
                      tema ? tema.tarjeta : "border-line hover:border-brand-blue"
                    }`}
                  >
                    <span className="text-sm font-medium text-ink">{g.nombre}</span>
                    <span className="text-xs text-ink-soft">
                      {modalidadEtiqueta[g.modalidad] ?? g.modalidad} · {g.totalAlumnos} alumno
                      {g.totalAlumnos === 1 ? "" : "s"}
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
    </div>
  );
}
