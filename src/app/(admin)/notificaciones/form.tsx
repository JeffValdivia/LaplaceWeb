"use client";

import { useActionState, useState } from "react";
import { publicarComunicado } from "@/lib/actions/comunicados";

const campo =
  "rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue-light/40";

export function ComunicadoForm({ grupos }: { grupos: { id: string; nombre: string }[] }) {
  const [error, formAction, pending] = useActionState(publicarComunicado, null);
  const [alcance, setAlcance] = useState("academia");

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Dirigido a</span>
          <select
            name="alcance"
            value={alcance}
            onChange={(e) => setAlcance(e.target.value)}
            className={campo}
          >
            <option value="academia">Toda la academia</option>
            <option value="grupo">Un grupo</option>
          </select>
        </label>
        {alcance === "grupo" && (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Grupo</span>
            <select name="grupo_id" required defaultValue="" className={campo}>
              <option value="" disabled>
                Selecciona…
              </option>
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium text-ink">Título</span>
          <input name="titulo" required className={campo} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium text-ink">Mensaje</span>
          <textarea name="mensaje" required rows={3} className={campo} />
        </label>
      </div>

      {error && (
        <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue disabled:opacity-60"
      >
        {pending ? "Publicando…" : "Publicar"}
      </button>
    </form>
  );
}
