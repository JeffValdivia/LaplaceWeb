"use client";

import { useMemo, useState } from "react";
import { ListaAlumnosPreview, type AlumnoLista } from "@/components/lista-alumnos-preview";

export type GrupoConAlumnos = {
  id: string;
  nombre: string;
  modalidad: string;
  sedeId: string;
  alumnos: AlumnoLista[];
};

const campo =
  "rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue-light/40 disabled:cursor-not-allowed disabled:opacity-50";

export function FiltroReporteAlumnos({
  sedes,
  grupos,
}: {
  sedes: { id: string; nombre: string }[];
  grupos: GrupoConAlumnos[];
}) {
  const [sedeId, setSedeId] = useState("");
  const [grupoId, setGrupoId] = useState("");
  const [fechaGeneracion] = useState(() =>
    new Date().toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" })
  );

  const gruposDeLaSede = useMemo(
    () => grupos.filter((g) => g.sedeId === sedeId),
    [grupos, sedeId]
  );
  const grupoSeleccionado = useMemo(
    () => grupos.find((g) => g.id === grupoId) ?? null,
    [grupos, grupoId]
  );
  const sedeSeleccionada = sedes.find((s) => s.id === sedeId) ?? null;

  function cambiarSede(nuevaSedeId: string) {
    setSedeId(nuevaSedeId);
    setGrupoId("");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-3 surface-card p-4 print:hidden">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Sede</span>
          <select value={sedeId} onChange={(e) => cambiarSede(e.target.value)} className={campo}>
            <option value="">Selecciona…</option>
            {sedes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Grupo</span>
          <select
            value={grupoId}
            onChange={(e) => setGrupoId(e.target.value)}
            disabled={!sedeId}
            className={campo}
          >
            <option value="">{sedeId ? "Selecciona…" : "Elige una sede primero"}</option>
            {gruposDeLaSede.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre}
              </option>
            ))}
          </select>
        </label>

        {grupoSeleccionado && (
          <button
            type="button"
            onClick={() => window.print()}
            className="ml-auto rounded-md bg-gradient-to-r from-brand-navy to-brand-blue px-4 py-2 text-sm font-medium text-white hover:brightness-110 hover:shadow-lg transition-all duration-200"
          >
            Imprimir / Guardar como PDF
          </button>
        )}
      </div>

      {grupoSeleccionado && sedeSeleccionada ? (
        <ListaAlumnosPreview
          sedeNombre={sedeSeleccionada.nombre}
          grupoNombre={grupoSeleccionado.nombre}
          modalidad={grupoSeleccionado.modalidad}
          alumnos={grupoSeleccionado.alumnos}
          fechaGeneracion={fechaGeneracion}
        />
      ) : (
        <p className="surface-card px-4 py-10 text-center text-sm text-ink-soft print:hidden">
          {sedeId ? "Elige un grupo para ver la vista previa." : "Elige una sede y luego un grupo para ver la vista previa."}
        </p>
      )}
    </div>
  );
}
