import { notFound } from "next/navigation";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { evaluaciones, cursos, grupos, sedes, asignaturas, preguntas, alternativas } from "@/lib/db/schema";
import { crearPregunta, crearAlternativa } from "@/lib/actions/evaluaciones";

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

export default async function EvaluacionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [evaluacion] = await db
    .select({
      id: evaluaciones.id,
      titulo: evaluaciones.titulo,
      grupoNombre: grupos.nombre,
      modalidad: grupos.modalidad,
      sedeNombre: sedes.nombre,
      asignaturaNombre: asignaturas.nombre,
    })
    .from(evaluaciones)
    .innerJoin(cursos, eq(cursos.id, evaluaciones.cursoId))
    .innerJoin(grupos, eq(grupos.id, cursos.grupoId))
    .innerJoin(sedes, eq(sedes.id, grupos.sedeId))
    .innerJoin(asignaturas, eq(asignaturas.id, cursos.asignaturaId))
    .where(eq(evaluaciones.id, id))
    .limit(1);

  if (!evaluacion) notFound();

  const listaPreguntas = await db
    .select()
    .from(preguntas)
    .where(eq(preguntas.evaluacionId, id))
    .orderBy(asc(preguntas.orden));

  const todasLasAlternativas = listaPreguntas.length
    ? await db
        .select()
        .from(alternativas)
        .where(inArray(alternativas.preguntaId, listaPreguntas.map((p) => p.id)))
        .orderBy(asc(alternativas.orden))
    : [];

  const alternativasPorPregunta = new Map<string, typeof todasLasAlternativas>();
  for (const a of todasLasAlternativas) {
    const arr = alternativasPorPregunta.get(a.preguntaId) ?? [];
    arr.push(a);
    alternativasPorPregunta.set(a.preguntaId, arr);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">{evaluacion.titulo}</h1>
        <p className="text-sm text-ink-soft">
          {evaluacion.sedeNombre} · {modalidadEtiqueta[evaluacion.modalidad] ?? evaluacion.modalidad} ·{" "}
          {evaluacion.grupoNombre} · {evaluacion.asignaturaNombre}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {listaPreguntas.map((p, i) => (
          <div key={p.id} className="rounded-lg border border-line bg-surface p-5">
            <p className="mb-3 font-medium text-ink">
              {i + 1}. {p.enunciado}{" "}
              <span className="font-mono-tab text-xs text-ink-soft">
                ({p.puntaje} pt)
              </span>
            </p>
            <ul className="mb-3 flex flex-col gap-1.5">
              {(alternativasPorPregunta.get(p.id) ?? []).map((a) => (
                <li key={a.id} className="flex items-center gap-2 text-sm">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      a.esCorrecta ? "bg-ok" : "bg-line"
                    }`}
                  />
                  {a.texto}
                </li>
              ))}
            </ul>
            <form action={crearAlternativa} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="pregunta_id" value={p.id} />
              <input
                name="texto"
                required
                placeholder="Nueva alternativa"
                className="flex-1 rounded-md border border-line bg-bg px-2 py-1.5 text-sm outline-none focus:border-brand-blue"
              />
              <label className="flex items-center gap-1.5 text-xs text-ink-soft">
                <input type="checkbox" name="es_correcta" /> Es correcta
              </label>
              <button
                type="submit"
                className="rounded-md border border-line px-2.5 py-1.5 text-xs text-ink-soft hover:border-brand-blue hover:text-brand-blue"
              >
                Agregar
              </button>
            </form>
          </div>
        ))}
      </div>

      <form
        action={crearPregunta}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface p-5"
      >
        <input type="hidden" name="evaluacion_id" value={id} />
        <label className="flex flex-1 flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Nueva pregunta</span>
          <input
            name="enunciado"
            required
            className="rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Puntaje</span>
          <input
            type="number"
            name="puntaje"
            defaultValue={1}
            min={0}
            step="0.5"
            className="w-24 rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue"
        >
          Agregar pregunta
        </button>
      </form>
    </div>
  );
}
