"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { actualizarGrupo, eliminarGrupo } from "./actions";
import { temaPorSede } from "@/lib/tema-sede";

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

type Curso = { asignaturaNombre: string; docenteNombre: string };
type Grupo = {
  id: string;
  nombre: string;
  modalidad: string;
  sedeId: string;
  sedeNombre: string;
};

function Badges({ grupo, cantidadCursos }: { grupo: Grupo; cantidadCursos: number }) {
  return (
    <div className="flex flex-wrap gap-1.5 text-xs">
      <span className="rounded-full bg-brand-blue-light/20 px-2.5 py-0.5 font-medium text-brand-blue">
        {grupo.sedeNombre}
      </span>
      <span className="rounded-full bg-line px-2.5 py-0.5 font-medium text-ink-soft">
        {modalidadEtiqueta[grupo.modalidad] ?? grupo.modalidad}
      </span>
      <span className="rounded-full bg-line px-2.5 py-0.5 font-mono-tab font-medium text-ink-soft">
        {cantidadCursos} curso{cantidadCursos === 1 ? "" : "s"}
      </span>
    </div>
  );
}

export function GrupoCard({ grupo, cursos }: { grupo: Grupo; cursos: Curso[] }) {
  const [abierto, setAbierto] = useState(false);
  const [modo, setModo] = useState<"ver" | "editar" | "confirmar-eliminar">("ver");
  const tema = temaPorSede[grupo.sedeNombre];

  const cerrar = () => {
    setAbierto(false);
    setModo("ver");
  };

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={`flex w-full flex-col gap-2 rounded-lg border bg-surface p-4 text-left shadow-sm transition-all duration-200 ${
          tema ? tema.tarjeta : "border-line hover:-translate-y-0.5 hover:border-brand-blue hover:shadow-md"
        }`}
      >
        <span className="font-medium text-ink">{grupo.nombre}</span>
        <Badges grupo={grupo} cantidadCursos={cursos.length} />
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={grupo.nombre}
          onClick={cerrar}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-md flex-col gap-4 rounded-lg bg-surface p-5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold text-ink">{grupo.nombre}</h2>
                <Badges grupo={grupo} cantidadCursos={cursos.length} />
              </div>
              <button
                type="button"
                onClick={cerrar}
                aria-label="Cerrar"
                className="rounded-md px-2 py-1 text-ink-soft hover:bg-bg hover:text-ink"
              >
                ✕
              </button>
            </div>

            {modo === "editar" ? (
              <form
                action={async (formData) => {
                  await actualizarGrupo(formData);
                  setModo("ver");
                }}
                className="flex flex-col gap-3 border-t border-line pt-4"
              >
                <input type="hidden" name="grupo_id" value={grupo.id} />
                <input type="hidden" name="sede_id" value={grupo.sedeId} />
                <label className="flex flex-col gap-1 text-xs">
                  <span className="font-medium text-ink">Nombre</span>
                  <input
                    name="nombre"
                    required
                    defaultValue={grupo.nombre}
                    className="rounded-md border border-line bg-bg px-2 py-1.5 text-sm outline-none focus:border-brand-blue"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs">
                  <span className="font-medium text-ink">Modalidad</span>
                  <select
                    name="modalidad"
                    defaultValue={grupo.modalidad}
                    className="rounded-md border border-line bg-bg px-2 py-1.5 text-sm outline-none focus:border-brand-blue"
                  >
                    <option value="presencial">Presencial</option>
                    <option value="virtual">Virtual</option>
                  </select>
                </label>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-md bg-gradient-to-r from-brand-navy to-brand-blue px-3 py-1.5 text-xs font-medium text-white hover:brightness-110 hover:shadow-lg transition-all duration-200"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setModo("ver")}
                    className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-bg"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="border-t border-line pt-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">
                    Cursos
                  </h3>
                  <ul className="flex flex-col divide-y divide-line text-sm">
                    {cursos.map((c, i) => (
                      <li key={i} className="flex items-center justify-between gap-2 py-1.5">
                        <span className="font-medium text-ink">{c.asignaturaNombre}</span>
                        <span className="text-xs text-ink-soft">{c.docenteNombre}</span>
                      </li>
                    ))}
                    {!cursos.length && (
                      <li className="py-1.5 text-xs italic text-ink-soft">
                        Sin cursos asignados todavía.
                      </li>
                    )}
                  </ul>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4 text-sm font-medium">
                  <Link
                    href={`/grupos/${grupo.id}`}
                    className="rounded-md bg-gradient-to-r from-brand-navy to-brand-blue px-3 py-1.5 text-white hover:brightness-110 hover:shadow-lg transition-all duration-200"
                  >
                    Gestionar cursos
                  </Link>
                  <Link
                    href={`/grupos/${grupo.id}/lista`}
                    className="rounded-md border border-line px-3 py-1.5 text-ink hover:border-brand-blue hover:text-brand-blue"
                  >
                    Lista de alumnos
                  </Link>
                  <button
                    type="button"
                    onClick={() => setModo("editar")}
                    className="rounded-md border border-line px-3 py-1.5 text-ink hover:border-brand-blue hover:text-brand-blue"
                  >
                    Editar
                  </button>
                  {modo === "confirmar-eliminar" ? (
                    <span className="flex items-center gap-2 text-danger">
                      ¿Seguro?
                      <form
                        action={async (formData) => {
                          await eliminarGrupo(formData);
                          cerrar();
                        }}
                      >
                        <input type="hidden" name="grupo_id" value={grupo.id} />
                        <input type="hidden" name="sede_id" value={grupo.sedeId} />
                        <button type="submit" className="underline">
                          Sí, eliminar
                        </button>
                      </form>
                      <button
                        type="button"
                        onClick={() => setModo("ver")}
                        className="text-ink-soft underline"
                      >
                        No
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setModo("confirmar-eliminar")}
                      className="rounded-md border border-danger/40 px-3 py-1.5 text-danger hover:bg-danger-soft"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
