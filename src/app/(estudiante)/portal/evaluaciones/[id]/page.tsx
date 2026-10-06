import { notFound, redirect } from "next/navigation";
import { asc, eq, and, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { evaluaciones, matriculas, cursos, preguntas, alternativas, intentos } from "@/lib/db/schema";
import { evaluacionAbierta } from "@/lib/evaluacion-estado";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { iniciarIntento } from "@/lib/actions/rendir";
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
  if (!curso || !curso.grupoId) notFound();

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

  let segundosRestantes: number | null = null;
  if (intento && !intento.entregadoAt && evaluacion.duracionMinutos) {
    const vencimiento = intento.iniciadoAt.getTime() + evaluacion.duracionMinutos * 60_000;
    segundosRestantes = Math.max(0, Math.round((vencimiento - Date.now()) / 1000));
  }

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
      ) : !intento ? (
        <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-ink-soft">Preguntas</dt>
              <dd className="font-mono-tab font-semibold text-ink">{preguntasCompletas.length}</dd>
            </div>
            <div>
              <dt className="text-ink-soft">Puntaje total</dt>
              <dd className="font-mono-tab font-semibold text-ink">{total}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-ink-soft">Tiempo</dt>
              <dd className="font-mono-tab font-semibold text-ink">
                {evaluacion.duracionMinutos ? `${evaluacion.duracionMinutos} minutos` : "Sin límite"}
              </dd>
            </div>
          </dl>
          {evaluacion.duracionMinutos && (
            <p className="rounded-md bg-warn-soft px-3 py-2 text-xs text-warn">
              El cronómetro arranca apenas presiones "Comenzar" y no se puede
              pausar ni reiniciar. Al llegar a 0 se entrega automáticamente lo
              que hayas respondido.
            </p>
          )}
          <form action={iniciarIntento}>
            <input type="hidden" name="evaluacion_id" value={id} />
            <button
              type="submit"
              className="self-start rounded-md bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-blue"
            >
              Comenzar
            </button>
          </form>
        </div>
      ) : (
        <RendirForm
          evaluacionId={id}
          preguntas={preguntasCompletas}
          segundosRestantes={segundosRestantes}
        />
      )}
    </div>
  );
}
