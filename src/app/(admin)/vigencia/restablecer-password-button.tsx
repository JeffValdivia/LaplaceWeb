"use client";

import { useActionState, useState } from "react";
import { restablecerPasswordEstudiante } from "./actions";

export function RestablecerPasswordButton({ estudianteId }: { estudianteId: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [resultado, formAction, pending] = useActionState(restablecerPasswordEstudiante, null);

  if (resultado) {
    return (
      <span className={`text-xs ${resultado.ok ? "text-ok" : "text-danger"}`}>{resultado.mensaje}</span>
    );
  }

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="text-xs font-medium text-brand-blue underline decoration-dotted hover:decoration-solid"
      >
        Restablecer contraseña
      </button>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-2 text-xs">
      <input type="hidden" name="estudiante_id" value={estudianteId} />
      <span className="text-ink-soft">¿Restablecer a su DNI?</span>
      <button
        type="submit"
        disabled={pending}
        className="font-medium text-danger underline decoration-dotted hover:decoration-solid disabled:opacity-60"
      >
        {pending ? "Restableciendo…" : "Sí"}
      </button>
      <button
        type="button"
        onClick={() => setConfirmando(false)}
        className="text-ink-soft underline decoration-dotted hover:decoration-solid"
      >
        No
      </button>
    </form>
  );
}
