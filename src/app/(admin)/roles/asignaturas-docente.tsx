"use client";

import { useState } from "react";
import { actualizarAsignaturasDocente } from "./actions";

export type AsignaturaOpcion = {
  id: string;
  nombre: string;
  sedeId: string;
  docenteId: string | null;
  docenteNombre: string | null;
};

// Casillas de las asignaturas de una sede. Si una ya tiene otro docente
// predeterminado se avisa, porque marcarla se la reasigna a este.
export function CasillasAsignaturas({
  asignaturas,
  sedeId,
  docenteId,
}: {
  asignaturas: AsignaturaOpcion[];
  sedeId: string;
  docenteId?: string;
}) {
  const deLaSede = asignaturas.filter((a) => a.sedeId === sedeId);
  if (!deLaSede.length) {
    return <p className="text-xs italic text-ink-soft">Esta sede todavía no tiene asignaturas.</p>;
  }
  return (
    <div className="flex flex-col gap-1">
      {deLaSede.map((a) => {
        const deOtro = a.docenteId && a.docenteId !== docenteId;
        return (
          <label key={a.id} className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              name="asignatura_ids"
              value={a.id}
              defaultChecked={!!docenteId && a.docenteId === docenteId}
            />
            {a.nombre}
            {deOtro && (
              <span className="text-xs text-warn">(hoy: {a.docenteNombre})</span>
            )}
          </label>
        );
      })}
    </div>
  );
}

export function AsignaturasDocente({
  docenteId,
  sedeId,
  asignaturas,
}: {
  docenteId: string;
  sedeId: string | null;
  asignaturas: AsignaturaOpcion[];
}) {
  const [editando, setEditando] = useState(false);
  const actuales = asignaturas.filter((a) => a.docenteId === docenteId);

  if (!editando) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {actuales.length ? (
          actuales.map((a) => (
            <span
              key={a.id}
              className="rounded-full bg-brand-blue-light/20 px-2.5 py-0.5 text-xs font-medium text-brand-blue"
            >
              {a.nombre}
            </span>
          ))
        ) : (
          <span className="text-xs text-ink-soft">Ninguna</span>
        )}
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="text-xs font-medium text-brand-blue hover:underline"
        >
          Editar
        </button>
      </div>
    );
  }

  if (!sedeId) {
    return (
      <div className="flex items-center gap-2 text-xs text-warn">
        Asígnale una sede primero.
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="text-ink-soft underline"
        >
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        await actualizarAsignaturasDocente(formData);
        setEditando(false);
      }}
      className="flex flex-col gap-2"
    >
      <input type="hidden" name="id" value={docenteId} />
      <CasillasAsignaturas asignaturas={asignaturas} sedeId={sedeId} docenteId={docenteId} />
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-gradient-to-r from-brand-navy to-brand-blue px-3 py-1 text-xs font-medium text-white hover:brightness-110 hover:shadow-lg transition-all duration-200"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={() => setEditando(false)}
          className="rounded-md border border-line px-3 py-1 text-xs font-medium text-ink-soft hover:bg-bg"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
