import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { matriculas, cursos, asignaturas, usuarios, evaluacionesDocente } from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { evaluacionDocenteEstaActiva } from "@/lib/evaluacion-docente";

export default async function EvaluacionDocentePortalPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario?.estudianteId) redirect("/login");

  const activa = await evaluacionDocenteEstaActiva();
  if (!activa) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-ink">Evaluación a docente</h1>
          <p className="text-sm text-ink-soft">
            Evalúa a tus docentes, un cuestionario por curso. Tus respuestas son
            anónimas.
          </p>
        </div>
        <p className="rounded-lg border border-line bg-surface px-4 py-6 text-center text-sm text-ink-soft">
          La evaluación a docentes no está disponible en este momento. La academia
          avisará cuando esté habilitada.
        </p>
      </div>
    );
  }

  const misGrupos = await db
    .select({ grupoId: matriculas.grupoId })
    .from(matriculas)
    .where(eq(matriculas.estudianteId, usuario.estudianteId));
  const grupoIds = misGrupos.map((g) => g.grupoId).filter((id): id is string => id !== null);

  const misCursos = grupoIds.length
    ? await db
        .select({
          id: cursos.id,
          asignaturaNombre: asignaturas.nombre,
          docenteNombre: usuarios.nombreCompleto,
        })
        .from(cursos)
        .innerJoin(asignaturas, eq(asignaturas.id, cursos.asignaturaId))
        .innerJoin(usuarios, eq(usuarios.id, cursos.docenteId))
        .where(inArray(cursos.grupoId, grupoIds))
    : [];

  const cursoIds = misCursos.map((c) => c.id);
  const misEnvios = cursoIds.length
    ? await db
        .select({ cursoId: evaluacionesDocente.cursoId })
        .from(evaluacionesDocente)
        .where(
          and(
            inArray(evaluacionesDocente.cursoId, cursoIds),
            eq(evaluacionesDocente.estudianteId, usuario.estudianteId)
          )
        )
    : [];
  const cursosEvaluados = new Set(misEnvios.map((e) => e.cursoId));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Evaluación a docente</h1>
        <p className="text-sm text-ink-soft">
          Evalúa a tus docentes, un cuestionario por curso. Tus respuestas son
          anónimas.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {misCursos.map((c) => {
          const evaluado = cursosEvaluados.has(c.id);
          return (
            <Link
              key={c.id}
              href={`/portal/evaluacion-docente/${c.id}`}
              className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface p-4 transition hover:border-brand-blue"
            >
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-brand-blue">{c.asignaturaNombre}</span>
                <span className="font-medium text-ink">{c.docenteNombre}</span>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                  evaluado ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn"
                }`}
              >
                {evaluado ? "Evaluado" : "Pendiente"}
              </span>
            </Link>
          );
        })}
        {!misCursos.length && (
          <p className="rounded-lg border border-line bg-surface px-4 py-6 text-center text-sm text-ink-soft">
            Todavía no tienes cursos para evaluar.
          </p>
        )}
      </div>
    </div>
  );
}
