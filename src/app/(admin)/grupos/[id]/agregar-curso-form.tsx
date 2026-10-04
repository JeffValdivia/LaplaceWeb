"use client";

import { useState } from "react";
import { agregarCurso } from "../actions";

const campo =
  "rounded-md border border-line bg-bg px-3 py-2 outline-none focus:border-brand-blue";

type Asignatura = { id: string; nombre: string; docenteId: string | null };
type Docente = { id: string; nombreCompleto: string; sedeId: string | null };

export function AgregarCursoForm({
  grupoId,
  asignaturas,
  docentes,
}: {
  grupoId: string;
  asignaturas: Asignatura[];
  docentes: Docente[];
}) {
  const [asignaturaId, setAsignaturaId] = useState("");
  const [docenteId, setDocenteId] = useState("");
  const [autocompletado, setAutocompletado] = useState(false);

  function elegirAsignatura(id: string) {
    setAsignaturaId(id);
    const predeterminado = asignaturas.find((a) => a.id === id)?.docenteId ?? null;
    const disponible = predeterminado && docentes.some((d) => d.id === predeterminado);
    setDocenteId(disponible ? predeterminado : "");
    setAutocompletado(!!disponible);
  }

  return (
    <form
      action={async (formData) => {
        await agregarCurso(formData);
        setAsignaturaId("");
        setDocenteId("");
        setAutocompletado(false);
      }}
      className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5 sm:flex-row sm:items-end sm:flex-wrap"
    >
      <input type="hidden" name="grupo_id" value={grupoId} />
      <label className="flex flex-1 flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">Asignatura</span>
        <select
          name="asignatura_id"
          required
          value={asignaturaId}
          onChange={(e) => elegirAsignatura(e.target.value)}
          className={campo}
        >
          <option value="" disabled>
            Selecciona…
          </option>
          {asignaturas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-1 flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">
          Docente
          {autocompletado && (
            <span className="ml-2 text-xs font-normal text-ok">
              · predeterminado de la asignatura
            </span>
          )}
        </span>
        <select
          name="docente_id"
          required
          value={docenteId}
          onChange={(e) => {
            setDocenteId(e.target.value);
            setAutocompletado(false);
          }}
          className={campo}
        >
          <option value="" disabled>
            Selecciona…
          </option>
          {docentes.map((d) => (
            <option key={d.id} value={d.id}>
              {d.sedeId ? d.nombreCompleto : `${d.nombreCompleto} (sin sede)`}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue"
      >
        Agregar asignatura al grupo
      </button>
    </form>
  );
}
