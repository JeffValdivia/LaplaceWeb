"use client";

import { actualizarDocenteCurso } from "../actions";

export function DocenteCursoSelect({
  cursoId,
  grupoId,
  docenteIdActual,
  docentes,
}: {
  cursoId: string;
  grupoId: string;
  docenteIdActual: string;
  docentes: { id: string; nombreCompleto: string }[];
}) {
  return (
    <form
      action={actualizarDocenteCurso}
      onChange={(e) => e.currentTarget.requestSubmit()}
    >
      <input type="hidden" name="curso_id" value={cursoId} />
      <input type="hidden" name="grupo_id" value={grupoId} />
      <select
        name="docente_id"
        defaultValue={docenteIdActual}
        className="rounded-md border border-line bg-bg px-2 py-1 text-sm outline-none focus:border-brand-blue"
      >
        {docentes.map((d) => (
          <option key={d.id} value={d.id}>
            {d.nombreCompleto}
          </option>
        ))}
      </select>
    </form>
  );
}
