"use server";

import { revalidatePath } from "next/cache";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  preguntasEvalDocente,
  alternativasEvalDocente,
  evaluacionesDocente,
  respuestasEvalDocente,
  evaluacionDocenteConfig,
  cursos,
  matriculas,
} from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { evaluacionDocenteEstaActiva } from "@/lib/evaluacion-docente";

export async function crearPreguntaEvalDocente(formData: FormData) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario || usuario.rol !== "admin") return;

  const enunciado = String(formData.get("enunciado") ?? "").trim();
  if (!enunciado) return;

  await db.insert(preguntasEvalDocente).values({ enunciado });
  revalidatePath("/", "layout");
}

export async function crearAlternativaEvalDocente(formData: FormData) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario || usuario.rol !== "admin") return;

  const preguntaId = String(formData.get("pregunta_id") ?? "");
  const texto = String(formData.get("texto") ?? "").trim();
  if (!preguntaId || !texto) return;

  await db.insert(alternativasEvalDocente).values({ preguntaId, texto });
  revalidatePath("/", "layout");
}

export async function cambiarEstadoEvaluacionDocente(formData: FormData) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario || usuario.rol !== "admin") return;

  const activo = String(formData.get("activo") ?? "") === "true";

  await db
    .insert(evaluacionDocenteConfig)
    .values({ id: 1, activo, actualizadoPor: usuario.id })
    .onConflictDoUpdate({
      target: evaluacionDocenteConfig.id,
      set: { activo, actualizadoPor: usuario.id, updatedAt: new Date() },
    });

  revalidatePath("/", "layout");
}

// El alumno rinde una sola vez por curso (un docente puede dictarle varios
// cursos distintos, y cada uno se evalúa aparte). El comentario es único al
// final, no por pregunta.
export async function enviarEvaluacionDocente(_prevState: string | null, formData: FormData) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario?.estudianteId) return "Tu sesión expiró, vuelve a iniciar sesión.";
  if (!(await evaluacionDocenteEstaActiva())) {
    return "La evaluación a docentes no está habilitada en este momento.";
  }

  const cursoId = String(formData.get("curso_id") ?? "");
  const comentario = String(formData.get("comentario") ?? "").trim() || null;
  if (!cursoId) return "Falta el curso.";

  const [curso] = await db
    .select({ id: cursos.id, grupoId: cursos.grupoId })
    .from(cursos)
    .where(eq(cursos.id, cursoId))
    .limit(1);
  if (!curso || !curso.grupoId) return "Ese curso ya no existe.";

  const [matriculado] = await db
    .select({ id: matriculas.id })
    .from(matriculas)
    .where(and(eq(matriculas.grupoId, curso.grupoId), eq(matriculas.estudianteId, usuario.estudianteId)))
    .limit(1);
  if (!matriculado) return "No perteneces a ese curso.";

  const preguntasActivas = await db
    .select({ id: preguntasEvalDocente.id })
    .from(preguntasEvalDocente)
    .where(eq(preguntasEvalDocente.activo, true));
  if (!preguntasActivas.length) return "Todavía no hay preguntas configuradas para esta evaluación.";

  const respuestasPorPregunta = preguntasActivas.map((p) => ({
    preguntaId: p.id,
    alternativaId: String(formData.get(`pregunta_${p.id}`) ?? ""),
  }));
  if (respuestasPorPregunta.some((r) => !r.alternativaId)) {
    return "Responde todas las preguntas antes de enviar.";
  }

  const alternativasValidas = await db
    .select({ id: alternativasEvalDocente.id, preguntaId: alternativasEvalDocente.preguntaId })
    .from(alternativasEvalDocente)
    .where(
      inArray(
        alternativasEvalDocente.id,
        respuestasPorPregunta.map((r) => r.alternativaId)
      )
    );
  const alternativaValidaPorPregunta = new Map(alternativasValidas.map((a) => [a.id, a.preguntaId]));
  const todasValidas = respuestasPorPregunta.every(
    (r) => alternativaValidaPorPregunta.get(r.alternativaId) === r.preguntaId
  );
  if (!todasValidas) return "Hubo un problema con tus respuestas, vuelve a intentar.";

  try {
    await db.transaction(async (tx) => {
      const [envio] = await tx
        .insert(evaluacionesDocente)
        .values({ cursoId, estudianteId: usuario.estudianteId!, comentario })
        .returning({ id: evaluacionesDocente.id });

      await tx.insert(respuestasEvalDocente).values(
        respuestasPorPregunta.map((r) => ({
          evaluacionDocenteId: envio.id,
          preguntaId: r.preguntaId,
          alternativaId: r.alternativaId,
        }))
      );
    });
  } catch (err: unknown) {
    const mensaje = err instanceof Error ? err.message : "";
    if (mensaje.includes("unique")) {
      return "Ya evaluaste a este docente en este curso.";
    }
    return "No se pudo enviar tu evaluación.";
  }

  revalidatePath("/", "layout");
  return null;
}
