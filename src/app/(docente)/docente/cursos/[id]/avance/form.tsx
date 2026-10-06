"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { registrarAvance } from "@/lib/actions/avance";
import { EditorDescripcion } from "./editor-texto";

const campo =
  "rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue-light/40";

const hoy = new Date().toISOString().slice(0, 10);

export function AvanceForm({ cursoId }: { cursoId: string }) {
  const [error, formAction, pending] = useActionState(registrarAvance, null);

  // El editor de observaciones mantiene su propio estado (contentEditable)
  // — a diferencia de los demás campos, no se vacía solo tras guardar.
  // Forzamos su remontaje cambiando la key apenas una entrega termina sin
  // error.
  const [resetKey, setResetKey] = useState(0);
  const pendienteAnterior = useRef(pending);
  useEffect(() => {
    if (pendienteAnterior.current && !pending && !error) {
      setResetKey((k) => k + 1);
    }
    pendienteAnterior.current = pending;
  }, [pending, error]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5"
    >
      <input type="hidden" name="curso_id" value={cursoId} />
      <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Fecha</span>
          <input type="date" name="fecha" required defaultValue={hoy} className={campo} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Tema dictado</span>
          <input name="tema" required placeholder="Ej. Ecuaciones de primer grado" className={campo} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">Observaciones (opcional)</span>
        <EditorDescripcion key={resetKey} name="descripcion" />
      </label>

      {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Registrar clase"}
      </button>
    </form>
  );
}
