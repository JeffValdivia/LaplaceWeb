"use client";

import { useActionState } from "react";
import { enviarEvaluacionDocente } from "@/lib/actions/evaluacion-docente";

type Pregunta = {
  id: string;
  enunciado: string;
  alternativas: { id: string; texto: string }[];
};

export function EvaluacionDocenteForm({ cursoId, preguntas }: { cursoId: string; preguntas: Pregunta[] }) {
  const [error, formAction, pending] = useActionState(enviarEvaluacionDocente, null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="curso_id" value={cursoId} />

      {preguntas.map((p, i) => (
        <fieldset key={p.id} className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4">
          <legend className="px-1 text-sm font-medium text-ink">
            {i + 1}. {p.enunciado}
          </legend>
          {p.alternativas.map((a) => (
            <label key={a.id} className="flex items-center gap-2 text-sm text-ink">
              <input type="radio" name={`pregunta_${p.id}`} value={a.id} required />
              {a.texto}
            </label>
          ))}
        </fieldset>
      ))}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">Comentario (opcional)</span>
        <textarea
          name="comentario"
          rows={4}
          placeholder="¿Algo más que quieras contarnos sobre este curso?"
          className="rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue-light/40"
        />
      </label>

      {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Enviar evaluación"}
      </button>
    </form>
  );
}
