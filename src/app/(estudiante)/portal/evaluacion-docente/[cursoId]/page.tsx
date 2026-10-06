import { notFound, redirect } from "next/navigation";
import { asc, eq, and, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  cursos,
  asignaturas,
  usuarios,
  matriculas,
  preguntasEvalDocente,
  alternativasEvalDocente,
  evaluacionesDocente,
} from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { evaluacionDocenteEstaActiva } from "@/lib/evaluacion-docente";
import { EvaluacionDocenteForm } from "./form";

export default async function EvaluacionDocenteFormPage({
  params,
}: {
  params: Promise<{ cursoId: string }>;
}) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario?.estudianteId) redirect("/login");

  const { cursoId } = await params;

  const [curso] = await db
    .select({
      id: cursos.id,
      grupoId: cursos.grupoId,
      asignaturaNombre: asignaturas.nombre,
      docenteNombre: usuarios.nombreCompleto,
    })
    .from(cursos)
    .innerJoin(asignaturas, eq(asignaturas.id, cursos.asignaturaId))
    .innerJoin(usuarios, eq(usuarios.id, cursos.docenteId))
    .where(eq(cursos.id, cursoId))
    .limit(1);
  if (!curso || !curso.grupoId) notFound();

  const [matriculado] = await db
    .select({ id: matriculas.id })
    .from(matriculas)
    .where(and(eq(matriculas.grupoId, curso.grupoId), eq(matriculas.estudianteId, usuario.estudianteId)))
    .limit(1);
  if (!matriculado) notFound();

  const [yaEnviada] = await db
    .select({ id: evaluacionesDocente.id })
    .from(evaluacionesDocente)
    .where(and(eq(evaluacionesDocente.cursoId, cursoId), eq(evaluacionesDocente.estudianteId, usuario.estudianteId)))
    .limit(1);

  const activa = yaEnviada ? true : await evaluacionDocenteEstaActiva();

  const preguntasBase = await db
    .select()
    .from(preguntasEvalDocente)
    .where(eq(preguntasEvalDocente.activo, true))
    .orderBy(asc(preguntasEvalDocente.orden));

  const preguntaIds = preguntasBase.map((p) => p.id);
  const todasLasAlternativas = preguntaIds.length
    ? await db
        .select({ id: alternativasEvalDocente.id, preguntaId: alternativasEvalDocente.preguntaId, texto: alternativasEvalDocente.texto })
        .from(alternativasEvalDocente)
        .where(inArray(alternativasEvalDocente.preguntaId, preguntaIds))
        .orderBy(asc(alternativasEvalDocente.orden))
    : [];

  const preguntasCompletas = preguntasBase
    .map((p) => ({
      id: p.id,
      enunciado: p.enunciado,
      alternativas: todasLasAlternativas.filter((a) => a.preguntaId === p.id),
    }))
    .filter((p) => p.alternativas.length > 0);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">{curso.docenteNombre}</h1>
        <p className="text-sm text-ink-soft">{curso.asignaturaNombre}</p>
      </div>

      {yaEnviada ? (
        <div className="rounded-lg border border-ok/30 bg-ok-soft px-4 py-3 text-ok">
          Ya evaluaste a este docente en este curso. ¡Gracias!
        </div>
      ) : !activa ? (
        <p className="rounded-lg border border-line bg-surface px-4 py-6 text-center text-sm text-ink-soft">
          La evaluación a docentes no está disponible en este momento.
        </p>
      ) : !preguntasCompletas.length ? (
        <p className="rounded-lg border border-line bg-surface px-4 py-6 text-center text-sm text-ink-soft">
          Todavía no hay un cuestionario configurado.
        </p>
      ) : (
        <EvaluacionDocenteForm cursoId={cursoId} preguntas={preguntasCompletas} />
      )}
    </div>
  );
}
