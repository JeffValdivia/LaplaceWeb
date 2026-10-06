"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { EstadoMatricula } from "@/lib/vigencia";
import type { TemaSede } from "@/lib/tema-sede";

const estadoEstilo: Record<EstadoMatricula, string> = {
  activa: "bg-ok-soft text-ok",
  por_vencer: "bg-warn-soft text-warn",
  vencida: "bg-danger-soft text-danger",
  retirada: "bg-line text-ink-soft",
};

const estadoTexto: Record<EstadoMatricula, string> = {
  activa: "Activa",
  por_vencer: "Por vencer",
  vencida: "Vencida",
  retirada: "Retirada",
};

export type AlumnoGrupo = {
  dni: string;
  nombres: string;
  apellidos: string;
  fechaFin: string;
  estado: EstadoMatricula;
};

export function GrupoAlumnosCard({
  grupoId,
  nombre,
  modalidad,
  alumnos,
  tema,
}: {
  grupoId: string;
  nombre: string;
  modalidad: string;
  alumnos: AlumnoGrupo[];
  tema?: TemaSede;
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
        className={`flex flex-col gap-1 rounded-lg border bg-bg p-4 text-left transition ${
          tema ? tema.tarjeta : "border-line hover:border-brand-blue"
        }`}
      >
        <span className="text-xs text-ink-soft">
          {nombre} · {modalidad}
        </span>
        <span className={`font-mono-tab text-2xl font-semibold ${tema ? tema.conteo : "text-ink"}`}>
          {alumnos.length}
        </span>
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={nombre}
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-lg flex-col gap-4 rounded-lg bg-surface p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-ink">{nombre}</h2>
                <span className="text-xs text-ink-soft">
                  {modalidad} · {alumnos.length} alumno{alumnos.length === 1 ? "" : "s"}
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

            <div className="max-h-[60vh] overflow-y-auto border-t border-line pt-3">
              <ul className="flex flex-col divide-y divide-line text-sm">
                {alumnos.map((a) => (
                  <li key={a.dni} className="flex items-center justify-between gap-3 py-2">
                    <div className="flex flex-col">
                      <span className="font-medium text-ink">
                        {a.nombres} {a.apellidos}
                      </span>
                      <span className="font-mono-tab text-xs text-ink-soft">{a.dni}</span>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${estadoEstilo[a.estado]}`}
                    >
                      {estadoTexto[a.estado]}
                    </span>
                  </li>
                ))}
                {!alumnos.length && (
                  <li className="py-3 text-center text-xs italic text-ink-soft">
                    Sin alumnos matriculados activos.
                  </li>
                )}
              </ul>
            </div>

            <div className="border-t border-line pt-3">
              <Link
                href={`/grupos/${grupoId}/lista`}
                className="text-sm font-medium text-brand-blue hover:underline"
              >
                Generar lista de alumnos (imprimir / PDF)
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
