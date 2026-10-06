"use client";

import { useState } from "react";
import { GrupoCard } from "./grupo-card";
import { temaPorSede } from "@/lib/tema-sede";

type Curso = { asignaturaNombre: string; docenteNombre: string };
type Grupo = { id: string; nombre: string; modalidad: string; sedeId: string; sedeNombre: string };
type Sede = { id: string; nombre: string };

export function SeccionesSede({
  sedes,
  grupos,
  cursosPorGrupo,
}: {
  sedes: Sede[];
  grupos: Grupo[];
  cursosPorGrupo: Record<string, Curso[]>;
}) {
  const [abiertas, setAbiertas] = useState<Set<string>>(new Set());

  function alternar(sedeId: string) {
    setAbiertas((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(sedeId)) siguiente.delete(sedeId);
      else siguiente.add(sedeId);
      return siguiente;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {sedes.map((s) => {
        const gruposDeLaSede = grupos.filter((g) => g.sedeId === s.id);
        const abierta = abiertas.has(s.id);
        const tema = temaPorSede[s.nombre];

        return (
          <section key={s.id} className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => alternar(s.id)}
              aria-expanded={abierta}
              className={`flex items-center justify-between gap-3 rounded-lg border bg-surface px-5 py-3.5 text-left transition ${
                abierta && tema ? tema.tarjeta : "border-line hover:border-brand-blue"
              }`}
            >
              <span className="text-sm font-semibold uppercase tracking-wide text-ink">
                {s.nombre}
              </span>
              <span className="flex items-center gap-2 text-xs text-ink-soft">
                {gruposDeLaSede.length} grupo{gruposDeLaSede.length === 1 ? "" : "s"}
                <span
                  className={`inline-block transition-transform ${abierta ? "rotate-180" : ""}`}
                >
                  ⌄
                </span>
              </span>
            </button>

            {abierta &&
              (gruposDeLaSede.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {gruposDeLaSede.map((g) => (
                    <GrupoCard key={g.id} grupo={g} cursos={cursosPorGrupo[g.id] ?? []} />
                  ))}
                </div>
              ) : (
                <p className="text-sm italic text-ink-soft">Esta sede todavía no tiene grupos.</p>
              ))}
          </section>
        );
      })}
    </div>
  );
}
