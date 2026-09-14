import { notFound, redirect } from "next/navigation";
import { asc, eq, and, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { evaluaciones, matriculas, cursos, preguntas, alternativas, intentos } from "@/lib/db/schema";
import { evaluacionAbierta } from "@/lib/evaluacion-estado";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { RendirForm } from "./form";

export default async function EvaluacionPortalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario?.estudianteId) redirect("/login");

  const { id } = await params;

  const [evaluacion] = await db
    .select()
    .from(evaluaciones)
    .where(eq(evaluaciones.id, id))
    .limit(1);

  if (!evaluacion) notFound();

  const [curso] = await db
    .select({ grupoId: cursos.grupoId })
    .from(cursos)
    .where(eq(cursos.id, evaluacion.cursoId))
    .limit(1);
  if (!curso) notFound();

  const [matriculado] = await db
    .select({ id: matriculas.id })
    .from(matriculas)
    .where(
      and(eq(matriculas.grupoId, curso.grupoId), eq(matriculas.estudianteId, usuario.estudianteId))
    )
    .limit(1);
  if (!matriculado) notFound();

  const [preguntasBase, [intento]] = await Promise.all([
    db.select().from(preguntas).where(eq(preguntas.evaluacionId, id)).orderBy(asc(preguntas.orden)),
    db
      .select()
      .from(intentos)
      .where(and(eq(intentos.evaluacionId, id), eq(intentos.estudianteId, usuario.estudianteId)))
      .limit(1),
  ]);

  const preguntaIds = preguntasBase.map((p) => p.id);
  const alternativasSinRespuesta = preguntaIds.length
    ? await db
        .select({
          id: alternativas.id,
          preguntaId: alternativas.preguntaId,
          texto: alternativas.texto,
          orden: alternativas.orden,
        })
        .from(alternativas)
        .where(inArray(alternativas.preguntaId, preguntaIds))
        .orderBy(asc(alternativas.orden))
    : [];

  const preguntasCompletas = preguntasBase.map((p) => ({
    ...p,
    alternativas: alternativasSinRespuesta.filter((a) => a.preguntaId === p.id),
  }));

  const total = preguntasCompletas.reduce((acc, p) => acc + Number(p.puntaje), 0);
  const abierta = evaluacionAbierta(evaluacion.disponibleDesde, evaluacion.disponibleHasta);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">{evaluacion.titulo}</h1>
        {evaluacion.descripcion && (
          <p className="text-sm text-ink-soft">{evaluacion.descripcion}</p>
        )}
      </div>

      {intento?.entregadoAt ? (
        <div className="rounded-lg border border-ok/30 bg-ok-soft px-4 py-3 text-ok">
          Ya rendiste esta evaluación. Tu puntaje:{" "}
          <span className="font-mono-tab font-semibold">
            {intento.puntajeObtenido ?? 0}/{total}
          </span>
        </div>
      ) : !abierta ? (
        <p className="rounded-lg border border-line bg-surface px-4 py-6 text-center text-sm text-ink-soft">
          Esta evaluación no está disponible en este momento.
        </p>
      ) : (
        <RendirForm evaluacionId={id} preguntas={preguntasCompletas} />
      )}
    </div>
  );
}
