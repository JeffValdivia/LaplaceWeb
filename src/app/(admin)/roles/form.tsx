"use client";

import { useActionState } from "react";
import { crearUsuario } from "./actions";

const campo =
  "rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue-light/40";

export function NuevoUsuarioForm() {
  const [error, formAction, pending] = useActionState(crearUsuario, null);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5 sm:flex-row sm:items-end sm:flex-wrap"
    >
      <label className="flex flex-1 flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">Nombre completo</span>
        <input name="nombre_completo" required className={campo} />
      </label>
      <label className="flex flex-1 flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">Correo</span>
        <input type="email" name="email" required className={campo} />
      </label>
      <label className="flex flex-1 flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">Contraseña inicial</span>
        <input type="password" name="password" required minLength={6} className={campo} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">Rol</span>
        <select name="rol" defaultValue="docente" className={campo}>
          <option value="admin">admin</option>
          <option value="docente">docente</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue disabled:opacity-60"
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
