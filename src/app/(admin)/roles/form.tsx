"use client";

import { useActionState, useState } from "react";
import { crearUsuario } from "./actions";
import { CasillasAsignaturas, type AsignaturaOpcion } from "./asignaturas-docente";

const campo =
  "rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue-light/40";

export function NuevoUsuarioForm({
  sedes,
  asignaturas,
}: {
  sedes: { id: string; nombre: string }[];
  asignaturas: AsignaturaOpcion[];
}) {
  const [error, formAction, pending] = useActionState(crearUsuario, null);
  const [rol, setRol] = useState("docente");
  const [sedeId, setSedeId] = useState("");

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 surface-card p-5 sm:flex-row sm:items-end sm:flex-wrap"
    >
      <label className="flex flex-1 flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">Nombre completo</span>
        <input name="nombre_completo" required className={campo} />
      </label>
      <label className="flex flex-1 flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">DNI</span>
        <input name="dni" required maxLength={8} className={campo} />
      </label>
      <label className="flex flex-1 flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">Contraseña inicial</span>
        <input type="password" name="password" required minLength={6} className={campo} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">Rol</span>
        <select
          name="rol"
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          className={campo}
        >
          <option value="admin">admin</option>
          <option value="docente">docente</option>
        </select>
      </label>
      {rol === "docente" && (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Sede donde dicta</span>
          <select
            name="sede_id"
            required
            value={sedeId}
            onChange={(e) => setSedeId(e.target.value)}
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
      )}
      {rol === "docente" && sedeId && (
        <fieldset key={sedeId} className="flex basis-full flex-col gap-1.5 text-sm">
          <legend className="mb-1 font-medium text-ink">Asignaturas que dicta (opcional)</legend>
          <CasillasAsignaturas asignaturas={asignaturas} sedeId={sedeId} />
        </fieldset>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-gradient-to-r from-brand-navy to-brand-blue px-4 py-2 text-sm font-medium text-white hover:brightness-110 hover:shadow-lg transition-all duration-200 disabled:opacity-60"
      >
        {pending ? "Creando…" : "Crear usuario"}
      </button>
      {error && (
        <p className="basis-full rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
