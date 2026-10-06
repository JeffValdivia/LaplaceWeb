"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { actualizarAvance } from "@/lib/actions/avance";
import { renderTextoConFormato } from "@/lib/formato-texto";
import { EditorDescripcion } from "./editor-texto";
import { EliminarAvanceButton } from "./eliminar-button";

export type AdjuntoAvance = { id: string; nombre: string; tipo: "imagen" | "archivo"; url: string };
export type Avance = { id: string; fecha: string; tema: string; descripcion: string | null };

const campo =
  "rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue-light/40";

export function AvanceEntry({
  avance,
  numeroSesion,
  adjuntos,
}: {
  avance: Avance;
  numeroSesion: number;
  adjuntos: AdjuntoAvance[];
}) {
  const [editando, setEditando] = useState(false);
  const [error, formAction, pending] = useActionState(actualizarAvance, null);
  const pendienteAnterior = useRef(pending);

  useEffect(() => {
    if (pendienteAnterior.current && !pending && !error) setEditando(false);
    pendienteAnterior.current = pending;
  }, [pending, error]);

  if (editando) {
    return (
      <form
        action={formAction}
        className="flex flex-col gap-3 rounded-lg border border-brand-blue bg-surface p-5"
      >
        <input type="hidden" name="id" value={avance.id} />
        <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Fecha</span>
            <input type="date" name="fecha" required defaultValue={avance.fecha} className={campo} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Tema dictado</span>
            <input name="tema" required defaultValue={avance.tema} className={campo} />
          </label>
        </div>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Observaciones (opcional)</span>
          <EditorDescripcion name="descripcion" defaultValue={avance.descripcion ?? ""} adjuntosExistentes={adjuntos} />
        </label>

        {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue disabled:opacity-60"
          >
            {pending ? "Guardando…" : "Guardar cambios"}
          </button>
          <button
            type="button"
            onClick={() => setEditando(false)}
            className="rounded-md border border-line px-4 py-2 text-sm text-ink-soft hover:bg-bg"
          >
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="font-mono-tab text-xs text-ink-soft">
            Sesión {numeroSesion} · {avance.fecha}
          </span>
          <p className="font-medium text-ink">{avance.tema}</p>
          {avance.descripcion && (
            <div className="mt-1 text-sm text-ink-soft">{renderTextoConFormato(avance.descripcion)}</div>
          )}
          {adjuntos.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {adjuntos.map((a) =>
                a.tipo === "imagen" ? (
                  <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.url}
                      alt={a.nombre}
                      className="h-20 w-20 rounded-md border border-line object-cover"
                    />
                  </a>
                ) : (
                  <a
                    key={a.id}
                    href={a.url}
                    className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-xs text-ink-soft hover:border-brand-blue hover:text-brand-blue"
                  >
                    📎 {a.nombre}
                  </a>
                )
              )}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="font-medium text-brand-blue hover:underline"
          >
            Editar
          </button>
          <EliminarAvanceButton id={avance.id} />
        </div>
      </div>
    </div>
  );
}
