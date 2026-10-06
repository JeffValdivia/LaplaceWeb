"use client";

import { useActionState, useState } from "react";
import { crearEvento } from "./actions";

const campo =
  "rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue-light/40";
const etiqueta = "flex flex-col gap-1.5 text-sm";

type Sede = { id: string; nombre: string };
type Grupo = { id: string; nombre: string; sedeId: string };

export function EventoForm({ sedes, grupos }: { sedes: Sede[]; grupos: Grupo[] }) {
  const [error, formAction, pending] = useActionState(crearEvento, null);
  const [alcance, setAlcance] = useState("academia");

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 surface-card p-5"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={etiqueta}>
          <span className="font-medium text-ink">Dirigido a</span>
          <select
            name="alcance"
            value={alcance}
            onChange={(e) => setAlcance(e.target.value)}
            className={campo}
          >
            <option value="academia">Todos (toda la academia)</option>
            <option value="sede">Una sede</option>
            <option value="grupo">Un grupo</option>
          </select>
        </label>

        {alcance === "sede" && (
          <label className={etiqueta}>
            <span className="font-medium text-ink">Sede</span>
            <select name="sede_id" required defaultValue="" className={campo}>
              <option value="" disabled>
                Selecciona…
              </option>
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </label>
        )}

        {alcance === "grupo" && (
          <label className={etiqueta}>
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

        <label className={etiqueta}>
          <span className="font-medium text-ink">Tipo</span>
          <select name="tipo" required defaultValue="academico" className={campo}>
            <option value="academico">Académico / General</option>
            <option value="examen">Examen</option>
            <option value="entrega">Revisión / Entrega</option>
          </select>
        </label>

        <label className={etiqueta}>
          <span className="font-medium text-ink">Fecha</span>
          <input type="date" name="fecha" required className={campo} />
        </label>

        <label className={`${etiqueta} sm:col-span-2`}>
          <span className="font-medium text-ink">Título</span>
          <input name="titulo" required className={campo} />
        </label>

        <label className={`${etiqueta} sm:col-span-2`}>
          <span className="font-medium text-ink">Descripción (opcional)</span>
          <textarea name="descripcion" rows={2} className={campo} />
        </label>
      </div>

      {error && (
        <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-gradient-to-r from-brand-navy to-brand-blue px-4 py-2 text-sm font-medium text-white hover:brightness-110 hover:shadow-lg transition-all duration-200 disabled:opacity-60"
      >
        {pending ? "Programando…" : "Programar evento"}
      </button>
    </form>
  );
}
