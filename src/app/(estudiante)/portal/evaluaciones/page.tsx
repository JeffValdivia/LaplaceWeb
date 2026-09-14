import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { evaluaciones, matriculas, cursos, asignaturas, preguntas, intentos } from "@/lib/db/schema";
import { evaluacionAbierta } from "@/lib/evaluacion-estado";
import { obtenerUsuarioActual } from "@/lib/auth/session";

export default async function EvaluacionesPortalPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario?.estudianteId) redirect("/login");

  const misGrupos = await db
    .select({ grupoId: matriculas.grupoId })
    .from(matriculas)
    .where(eq(matriculas.estudianteId, usuario.estudianteId));
  const grupoIds = misGrupos.map((g) => g.grupoId);

  const misCursos = grupoIds.length
    ? await db.select({ id: cursos.id }).from(cursos).where(inArray(cursos.grupoId, grupoIds))
    : [];
  const cursoIds = misCursos.map((c) => c.id);

  const listaEvaluaciones = cursoIds.length
    ? await db
        .select({
          id: evaluaciones.id,
          titulo: evaluaciones.titulo,
          disponibleDesde: evaluaciones.disponibleDesde,
          disponibleHasta: evaluaciones.disponibleHasta,
          asignaturaNombre: asignaturas.nombre,
          totalPuntos: sql<number>`coalesce(sum(${preguntas.puntaje}), 0)`.mapWith(Number),
        })
        .from(evaluaciones)
        .innerJoin(cursos, eq(cursos.id, evaluaciones.cursoId))
        .innerJoin(asignaturas, eq(asignaturas.id, cursos.asignaturaId))
        .leftJoin(preguntas, eq(preguntas.evaluacionId, evaluaciones.id))
        .where(inArray(evaluaciones.cursoId, cursoIds))
        .groupBy(evaluaciones.id, asignaturas.nombre)
        .orderBy(desc(evaluaciones.createdAt))
    : [];

  const misIntentos = listaEvaluaciones.length
    ? await db
        .select()
        .from(intentos)
        .where(
          inArray(
            intentos.evaluacionId,
            listaEvaluaciones.map((e) => e.id)
          )
        )
    : [];
  const intentoPorEvaluacion = new Map(misIntentos.map((i) => [i.evaluacionId, i]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Evaluaciones</h1>
        <p className="text-sm text-ink-soft">Rinde solo una vez cada evaluación.</p>
      </div>

      <div className="flex flex-col gap-3">
        {listaEvaluaciones.map((ev) => {
          const intento = intentoPorEvaluacion.get(ev.id);
          const abierta = evaluacionAbierta(ev.disponibleDesde, ev.disponibleHasta);

          let estado: string;
          let estilo: string;
          if (intento?.entregadoAt) {
            estado = `Rendida: ${intento.puntajeObtenido ?? 0}/${ev.totalPuntos} pts`;
            estilo = "bg-ok-soft text-ok";
          } else if (!abierta) {
            estado = "Cerrada";
            estilo = "bg-line text-ink-soft";
          } else {
            estado = "Pendiente";
            estilo = "bg-warn-soft text-warn";
          }

          return (
            <Link
              key={ev.id}
              href={`/portal/evaluaciones/${ev.id}`}
              className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface p-4 transition hover:border-brand-blue"
            >
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-brand-blue">{ev.asignaturaNombre}</span>
                <span className="font-medium text-ink">{ev.titulo}</span>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${estilo}`}>
                {estado}
              </span>
            </Link>
          );
        })}
        {!listaEvaluaciones.length && (
          <p className="rounded-lg border border-line bg-surface px-4 py-6 text-center text-sm text-ink-soft">
            Todavía no hay evaluaciones para tu grupo.
          </p>
        )}
      </div>
    </div>
  );
}
