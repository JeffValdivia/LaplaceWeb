"use client";

import { useActionState } from "react";
import { publicarComunicado } from "@/lib/actions/comunicados";

const campo =
  "rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue-light/40";

export function ComunicadoGrupoForm({ grupoId }: { grupoId: string }) {
  const [error, formAction, pending] = useActionState(publicarComunicado, null);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5"
    >
      <input type="hidden" name="alcance" value="grupo" />
      <input type="hidden" name="grupo_id" value={grupoId} />

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">Título</span>
        <input name="titulo" required className={campo} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">Mensaje</span>
        <textarea name="mensaje" required rows={3} className={campo} />
      </label>

      {error && (
        <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue disabled:opacity-60"
      >
        {pending ? "Publicando…" : "Publicar en el grupo"}
      </button>
    </form>
  );
}
