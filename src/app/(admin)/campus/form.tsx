"use client";

import { useActionState } from "react";
import { subirRecurso } from "@/lib/actions/campus";

const campo =
  "rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue-light/40";

export function SubirRecursoForm({
  cursos,
}: {
  cursos: { id: string; etiqueta: string }[];
}) {
  const [error, formAction, pending] = useActionState(subirRecurso, null);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Curso</span>
          <select name="curso_id" required defaultValue="" className={campo}>
            <option value="" disabled>
              Selecciona…
            </option>
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.etiqueta}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Título</span>
          <input name="titulo" required className={campo} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          <span className="font-medium text-ink">Descripción (opcional)</span>
          <input name="descripcion" className={campo} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Archivo (máx. 20 MB)</span>
          <input
            type="file"
            name="archivo"
            className="rounded-md border border-line bg-bg px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-brand-navy file:px-3 file:py-1.5 file:text-white"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">O un enlace (video, etc.)</span>
          <input name="enlace_url" type="url" placeholder="https://…" className={campo} />
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
        {pending ? "Subiendo…" : "Publicar recurso"}
      </button>
    </form>
  );
}
