export type PreguntaConConteo = {
  id: string;
  enunciado: string;
  alternativas: { id: string; texto: string; conteo: number }[];
};

export function ResultadosEvaluacionDocente({
  preguntas,
  comentarios,
  totalEnvios,
}: {
  preguntas: PreguntaConConteo[];
  comentarios: string[];
  totalEnvios: number;
}) {
  if (!totalEnvios) {
    return (
      <p className="rounded-lg border border-line bg-surface px-4 py-6 text-center text-sm text-ink-soft">
        Este curso todavía no tiene evaluaciones de alumnos.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-soft">
        <span className="font-mono-tab font-semibold text-ink">{totalEnvios}</span> alumno
        {totalEnvios === 1 ? "" : "s"} evaluaron este curso. Las respuestas son anónimas.
      </p>

      {preguntas.map((p) => {
        const totalPregunta = p.alternativas.reduce((acc, a) => acc + a.conteo, 0);
        return (
          <div key={p.id} className="surface-card p-5">
            <p className="mb-3 font-medium text-ink">{p.enunciado}</p>
            <div className="flex flex-col gap-2">
              {p.alternativas.map((a) => {
                const pct = totalPregunta ? Math.round((a.conteo / totalPregunta) * 100) : 0;
                return (
                  <div key={a.id} className="flex items-center gap-3 text-sm">
                    <span className="w-40 shrink-0 text-ink-soft">{a.texto}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full bg-brand-blue"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right font-mono-tab text-xs text-ink-soft">
                      {a.conteo} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="surface-card p-5">
        <h3 className="mb-3 font-medium text-ink">Comentarios</h3>
        <div className="flex flex-col gap-2">
          {comentarios.map((c, i) => (
            <p key={i} className="rounded-md border border-line bg-bg px-3 py-2 text-sm text-ink-soft">
              {c}
            </p>
          ))}
          {!comentarios.length && (
            <p className="text-sm italic text-ink-soft">Nadie dejó comentario.</p>
          )}
        </div>
      </div>
    </div>
  );
}
