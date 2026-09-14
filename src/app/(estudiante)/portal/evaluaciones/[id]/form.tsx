"use client";

import { useActionState } from "react";
import { entregarIntento } from "@/lib/actions/rendir";

type Pregunta = {
  id: string;
  enunciado: string;
  puntaje: string;
  alternativas: { id: string; texto: string }[];
};

export function RendirForm({
  evaluacionId,
  preguntas,
}: {
  evaluacionId: string;
  preguntas: Pregunta[];
}) {
  const [error, formAction, pending] = useActionState(entregarIntento, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="evaluacion_id" value={evaluacionId} />

      {preguntas.map((p, i) => (
        <fieldset
          key={p.id}
          className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4"
        >
          <legend className="px-1 text-sm font-medium text-ink">
            {i + 1}. {p.enunciado}{" "}
            <span className="font-mono-tab text-xs text-ink-soft">({p.puntaje} pt)</span>
          </legend>
          {p.alternativas.map((a) => (
            <label key={a.id} className="flex items-center gap-2 text-sm text-ink">
              <input type="radio" name={`pregunta_${p.id}`} value={a.id} required />
              {a.texto}
            </label>
          ))}
        </fieldset>
      ))}

      {error && (
        <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Entregar evaluación"}
      </button>
    </form>
  );
}
