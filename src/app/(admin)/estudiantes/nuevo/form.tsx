"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { matricularEstudiante } from "../actions";

const hoy = new Date().toISOString().slice(0, 10);

const campo =
  "rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue-light/40";
const etiqueta = "flex flex-col gap-1.5 text-sm";

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

type Sede = { id: string; nombre: string };
type Grupo = { id: string; nombre: string; modalidad: string; sedeId: string };

export function NuevoEstudianteForm({
  sedes,
  grupos,
}: {
  sedes: Sede[];
  grupos: Grupo[];
}) {
  const [error, formAction, pending] = useActionState(matricularEstudiante, null);
  const [sedeId, setSedeId] = useState("");
  const [grupoId, setGrupoId] = useState("");

  const gruposDeLaSede = useMemo(
    () => grupos.filter((g) => g.sedeId === sedeId),
    [grupos, sedeId]
  );

  return (
    <form
      action={formAction}
      className="flex max-w-2xl flex-col gap-6 rounded-lg border border-line bg-surface p-6"
    >
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-sm font-medium text-ink">Datos del estudiante</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={etiqueta}>
            <span className="font-medium text-ink">DNI</span>
            <input name="dni" required maxLength={8} className={campo} />
          </label>
          <label className={etiqueta}>
            <span className="font-medium text-ink">Teléfono</span>
            <input name="telefono" className={campo} />
          </label>
          <label className={etiqueta}>
            <span className="font-medium text-ink">Nombres</span>
            <input name="nombres" required className={campo} />
          </label>
          <label className={etiqueta}>
            <span className="font-medium text-ink">Apellidos</span>
            <input name="apellidos" required className={campo} />
          </label>
          <label className={`${etiqueta} sm:col-span-2`}>
            <span className="font-medium text-ink">Correo (opcional)</span>
            <input type="email" name="email" className={campo} />
          </label>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-t border-line pt-4">
        <legend className="mb-1 text-sm font-medium text-ink">Apoderado</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={etiqueta}>
            <span className="font-medium text-ink">Nombre del apoderado</span>
            <input name="apoderado_nombre" className={campo} />
          </label>
          <label className={etiqueta}>
            <span className="font-medium text-ink">Teléfono del apoderado</span>
            <input name="apoderado_telefono" className={campo} />
          </label>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-t border-line pt-4">
        <legend className="mb-1 text-sm font-medium text-ink">Matrícula</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={etiqueta}>
            <span className="font-medium text-ink">Sede</span>
            <select
              value={sedeId}
              onChange={(e) => {
                setSedeId(e.target.value);
                setGrupoId("");
              }}
              required
              className={campo}
            >
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
          <label className={etiqueta}>
            <span className="font-medium text-ink">Grupo académico</span>
            <select
              name="grupo_id"
              value={grupoId}
              onChange={(e) => setGrupoId(e.target.value)}
              required
              disabled={!sedeId}
              className={campo}
            >
              <option value="" disabled>
                {sedeId ? "Selecciona…" : "Elige primero una sede"}
              </option>
              {gruposDeLaSede.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nombre} · {modalidadEtiqueta[g.modalidad] ?? g.modalidad}
                </option>
              ))}
            </select>
            {sedeId && !gruposDeLaSede.length && (
              <span className="text-xs text-warn">Esta sede todavía no tiene grupos.</span>
            )}
          </label>
          <label className={etiqueta}>
            <span className="font-medium text-ink">Fecha de ingreso</span>
            <input
              type="date"
              name="fecha_ingreso"
              required
              defaultValue={hoy}
              className={campo}
            />
          </label>
        </div>
      </fieldset>

      {error && (
        <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Matricular"}
      </button>
    </form>
  );
}
