"use client";

import { actualizarSedeDocente } from "./actions";

export function SedeDocenteSelect({
  id,
  sedeIdActual,
  sedes,
}: {
  id: string;
  sedeIdActual: string | null;
  sedes: { id: string; nombre: string }[];
}) {
  return (
    <form action={actualizarSedeDocente} onChange={(e) => e.currentTarget.requestSubmit()}>
      <input type="hidden" name="id" value={id} />
      <select
        name="sede_id"
        defaultValue={sedeIdActual ?? ""}
        className="rounded-md border border-line bg-bg px-2 py-1 text-sm outline-none focus:border-brand-blue"
      >
        <option value="">Sin sede</option>
        {sedes.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nombre}
          </option>
        ))}
      </select>
    </form>
  );
}
