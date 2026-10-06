"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { entregarIntento } from "@/lib/actions/rendir";

type Pregunta = {
  id: string;
  enunciado: string;
  puntaje: string;
  alternativas: { id: string; texto: string }[];
};

function formatearTiempo(segundos: number) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function Cronometro({
  segundosIniciales,
  onVencer,
}: {
  segundosIniciales: number;
  onVencer: () => void;
}) {
  const [segundos, setSegundos] = useState(segundosIniciales);
  const vencioRef = useRef(false);

  useEffect(() => {
    if (segundos <= 0) {
      if (!vencioRef.current) {
        vencioRef.current = true;
        onVencer();
      }
      return;
    }
    const t = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [segundos, onVencer]);

  const urgente = segundos <= 60;

  return (
    <div
      className={`sticky top-0 z-10 flex items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-sm font-medium ${
        urgente ? "border-danger/40 bg-danger-soft text-danger" : "border-line bg-surface text-ink"
      }`}
    >
      <span>Tiempo restante</span>
      <span className="font-mono-tab text-lg">{formatearTiempo(segundos)}</span>
    </div>
  );
}

export function RendirForm({
  evaluacionId,
  preguntas,
  segundosRestantes,
}: {
  evaluacionId: string;
  preguntas: Pregunta[];
  segundosRestantes: number | null;
}) {
  const [error, formAction, pending] = useActionState(entregarIntento, null);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="evaluacion_id" value={evaluacionId} />

      {segundosRestantes !== null && (
        <Cronometro
          segundosIniciales={segundosRestantes}
          onVencer={() => formRef.current?.requestSubmit()}
        />
      )}

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
              <input type="radio" name={`pregunta_${p.id}`} value={a.id} />
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
