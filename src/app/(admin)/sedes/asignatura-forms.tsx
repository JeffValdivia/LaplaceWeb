"use client";

import { useActionState, useState } from "react";
import { crearAsignatura, actualizarDocenteAsignatura } from "./actions";

type Sede = { id: string; nombre: string };
export type DocenteOpcion = { id: string; nombreCompleto: string; sedeId: string | null };

const campo =
  "rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue";

function docentesDeSede(docentes: DocenteOpcion[], sedeId: string) {
  return docentes.filter((d) => d.sedeId === sedeId || d.sedeId === null);
}

function etiquetaDocente(d: DocenteOpcion) {
  return d.sedeId ? d.nombreCompleto : `${d.nombreCompleto} (sin sede)`;
}

export function NuevaAsignaturaForm({
  sedes,
  docentes,
}: {
  sedes: Sede[];
  docentes: DocenteOpcion[];
}) {
  const [error, formAction, pending] = useActionState(crearAsignatura, null);
  const [sedeId, setSedeId] = useState("");
  const opciones = sedeId ? docentesDeSede(docentes, sedeId) : [];

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input name="nombre" required placeholder="Nombre de la asignatura" className={campo} />
      <select
        name="sede_id"
        required
        value={sedeId}
        onChange={(e) => setSedeId(e.target.value)}
        className={campo}
      >
        <option value="" disabled>
          Sede…
        </option>
        {sedes.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nombre}
          </option>
        ))}
      </select>
      <select
        key={sedeId}
        name="docente_id"
        defaultValue=""
        disabled={!sedeId}
        className={campo}
      >
        <option value="">
          {sedeId ? "Docente predeterminado (opcional)…" : "Elige primero una sede"}
        </option>
        {opciones.map((d) => (
          <option key={d.id} value={d.id}>
            {etiquetaDocente(d)}
          </option>
        ))}
      </select>
      {error && (
        <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-brand-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-blue disabled:opacity-60"
      >
        {pending ? "Agregando…" : "Agregar asignatura"}
      </button>
    </form>
  );
}

export function DocenteAsignaturaSelect({
  asignaturaId,
  sedeId,
  docenteIdActual,
  docentes,
}: {
  asignaturaId: string;
  sedeId: string;
  docenteIdActual: string | null;
  docentes: DocenteOpcion[];
}) {
  return (
    <form
      action={actualizarDocenteAsignatura}
      onChange={(e) => e.currentTarget.requestSubmit()}
    >
      <input type="hidden" name="asignatura_id" value={asignaturaId} />
      <select
        name="docente_id"
        defaultValue={docenteIdActual ?? ""}
        className="rounded-md border border-line bg-bg px-2 py-1 text-sm outline-none focus:border-brand-blue"
      >
        <option value="">Sin docente predeterminado</option>
        {docentesDeSede(docentes, sedeId).map((d) => (
          <option key={d.id} value={d.id}>
            {etiquetaDocente(d)}
          </option>
        ))}
      </select>
    </form>
  );
}
