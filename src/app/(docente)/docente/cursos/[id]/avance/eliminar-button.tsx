"use client";

import { eliminarAvance } from "@/lib/actions/avance";

export function EliminarAvanceButton({ id }: { id: string }) {
  return (
    <form action={eliminarAvance}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="shrink-0 text-xs text-danger underline decoration-dotted hover:decoration-solid"
      >
        Eliminar
      </button>
    </form>
  );
}
