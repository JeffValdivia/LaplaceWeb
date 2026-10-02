"use client";

import { useState } from "react";
import Link from "next/link";
import { actualizarGrupo, eliminarGrupo } from "./actions";

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

export function GrupoFila({
  grupo,
}: {
  grupo: {
    id: string;
    nombre: string;
    modalidad: string;
    sedeId: string;
    sedeNombre: string;
    cantidadCursos: number;
  };
}) {
  const [modo, setModo] = useState<"ver" | "editar" | "confirmar-eliminar">("ver");

  if (modo === "editar") {
    return (
      <tr className="border-b border-line bg-bg last:border-0">
        <td colSpan={5} className="px-4 py-3">
          <form
            action={async (formData) => {
              await actualizarGrupo(formData);
              setModo("ver");
            }}
            className="flex flex-wrap items-end gap-3"
          >
            <input type="hidden" name="grupo_id" value={grupo.id} />
            <input type="hidden" name="sede_id" value={grupo.sedeId} />
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-medium text-ink">Nombre</span>
              <input
                name="nombre"
                required
                defaultValue={grupo.nombre}
                className="rounded-md border border-line bg-surface px-2 py-1.5 text-sm outline-none focus:border-brand-blue"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="font-medium text-ink">Modalidad</span>
              <select
                name="modalidad"
                defaultValue={grupo.modalidad}
                className="rounded-md border border-line bg-surface px-2 py-1.5 text-sm outline-none focus:border-brand-blue"
              >
                <option value="presencial">Presencial</option>
                <option value="virtual">Virtual</option>
              </select>
            </label>
            <span className="pb-1.5 text-xs text-ink-soft">Sede: {grupo.sedeNombre}</span>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-md bg-brand-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-blue"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setModo("ver")}
                className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-surface"
              >
                Cancelar
              </button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-line last:border-0">
      <td className="px-4 py-3 font-medium text-ink">{grupo.nombre}</td>
      <td className="px-4 py-3 text-ink-soft">
        <Link href={`/sedes/${grupo.sedeId}`} className="hover:text-brand-blue hover:underline">
          {grupo.sedeNombre}
        </Link>
      </td>
      <td className="px-4 py-3 text-ink-soft">
        {modalidadEtiqueta[grupo.modalidad] ?? grupo.modalidad}
      </td>
      <td className="px-4 py-3 font-mono-tab text-ink-soft">{grupo.cantidadCursos}</td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-3 text-xs font-medium whitespace-nowrap">
          <Link href={`/grupos/${grupo.id}`} className="text-brand-blue hover:underline">
            Gestionar cursos
          </Link>
          <button type="button" onClick={() => setModo("editar")} className="text-brand-blue hover:underline">
            Editar
          </button>
          {modo === "confirmar-eliminar" ? (
            <span className="flex items-center gap-2 text-red-600">
              ¿Seguro?
              <form
                action={async (formData) => {
                  await eliminarGrupo(formData);
                  setModo("ver");
                }}
              >
                <input type="hidden" name="grupo_id" value={grupo.id} />
                <input type="hidden" name="sede_id" value={grupo.sedeId} />
                <button type="submit" className="underline">
                  Sí, eliminar
                </button>
              </form>
              <button type="button" onClick={() => setModo("ver")} className="text-ink-soft underline">
                No
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setModo("confirmar-eliminar")}
              className="text-red-600 hover:underline"
            >
              Eliminar
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
