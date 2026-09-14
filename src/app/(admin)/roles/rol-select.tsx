"use client";

import { actualizarRol } from "./actions";

const roles = ["admin", "docente", "estudiante"] as const;

export function RolSelect({ id, rolActual }: { id: string; rolActual: string }) {
  return (
    <form action={actualizarRol} onChange={(e) => e.currentTarget.requestSubmit()}>
      <input type="hidden" name="id" value={id} />
      <select
        name="rol"
        defaultValue={rolActual}
        className="rounded-md border border-line bg-bg px-2 py-1 text-sm outline-none focus:border-brand-blue"
      >
        {roles.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </form>
  );
}
