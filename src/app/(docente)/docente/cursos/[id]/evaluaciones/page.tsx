import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { desc, eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { evaluaciones, preguntas, cursos } from "@/lib/db/schema";
import { crearEvaluacion } from "@/lib/actions/evaluaciones";
import { obtenerUsuarioActual } from "@/lib/auth/session";

export default async function EvaluacionesDocentePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");

  const { id } = await params;

  const [curso] = await db
    .select({ id: cursos.id })
    .from(cursos)
    .where(and(eq(cursos.id, id), eq(cursos.docenteId, usuario.id)))
    .limit(1);
  if (!curso) notFound();

  const filas = await db
    .select({
      id: evaluaciones.id,
      titulo: evaluaciones.titulo,
      disponibleDesde: evaluaciones.disponibleDesde,
      disponibleHasta: evaluaciones.disponibleHasta,
      duracionMinutos: evaluaciones.duracionMinutos,
      cantidadPreguntas: sql<number>`count(${preguntas.id})`.mapWith(Number),
    })
    .from(evaluaciones)
    .leftJoin(preguntas, eq(preguntas.evaluacionId, evaluaciones.id))
    .where(eq(evaluaciones.cursoId, id))
    .groupBy(evaluaciones.id)
    .orderBy(desc(evaluaciones.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Evaluaciones</h1>
        <p className="text-sm text-ink-soft">
          Crea la evaluación y entra a cada una para agregar preguntas y
          alternativas.
        </p>
      </div>

      <form
        action={crearEvaluacion}
        className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5"
      >
        <input type="hidden" name="curso_id" value={id} />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
            <span className="font-medium text-ink">Título</span>
            <input
              name="titulo"
              required
              className="rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Disponible desde</span>
            <input
              type="datetime-local"
              name="disponible_desde"
              className="rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Disponible hasta</span>
            <input
              type="datetime-local"
              name="disponible_hasta"
              className="rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Duración del intento (minutos, opcional)</span>
            <input
              type="number"
              name="duracion_minutos"
              min={1}
              placeholder="Ej. 15 — déjalo vacío para sin límite"
              className="rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
            />
          </label>
        </div>
        <p className="text-xs text-ink-soft">
          "Disponible desde/hasta" es la ventana en que se puede empezar. La
          duración es el cronómetro que corre desde que el alumno abre su
          intento — al llegar a 0 se entrega automáticamente.
        </p>
        <button
          type="submit"
          className="self-start rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue"
        >
          Crear evaluación
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {filas.map((ev) => (
          <Link
            key={ev.id}
            href={`/docente/cursos/${id}/evaluaciones/${ev.id}`}
            className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface p-4 transition hover:border-brand-blue"
          >
            <span className="font-medium text-ink">{ev.titulo}</span>
            <span className="flex items-center gap-2 font-mono-tab text-xs text-ink-soft">
              {ev.duracionMinutos && (
                <span className="rounded-full bg-brand-blue-light/20 px-2 py-0.5 text-brand-blue">
                  ⏱ {ev.duracionMinutos} min
                </span>
              )}
              {ev.cantidadPreguntas} pregunta{ev.cantidadPreguntas === 1 ? "" : "s"}
            </span>
          </Link>
        ))}
        {!filas.length && (
          <p className="rounded-lg border border-line bg-surface px-4 py-6 text-center text-sm text-ink-soft">
            Todavía no creaste ninguna evaluación.
          </p>
        )}
      </div>
    </div>
  );
}
