"use server";

import { revalidatePath } from "next/cache";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { evaluaciones, matriculas, intentos, respuestas, preguntas, alternativas, cursos } from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { evaluacionAbierta } from "@/lib/evaluacion-estado";

export async function entregarIntento(_prevState: string | null, formData: FormData) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario || usuario.rol !== "estudiante" || !usuario.estudianteId) {
    return "No pudimos identificar tu matrícula.";
  }

  const evaluacionId = String(formData.get("evaluacion_id") ?? "");
  if (!evaluacionId) return "Falta la evaluación.";

  const [evaluacion] = await db
    .select()
    .from(evaluaciones)
    .where(eq(evaluaciones.id, evaluacionId))
    .limit(1);

  if (!evaluacion) return "Esa evaluación no existe.";
  if (!evaluacionAbierta(evaluacion.disponibleDesde, evaluacion.disponibleHasta)) {
    return "Esta evaluación no está disponible en este momento.";
  }

  const [curso] = await db
    .select({ grupoId: cursos.grupoId })
    .from(cursos)
    .where(eq(cursos.id, evaluacion.cursoId))
    .limit(1);
  if (!curso) return "Ese curso ya no existe.";

  // El estudiante debe estar matriculado en el grupo del curso evaluado.
  const [matriculado] = await db
    .select({ id: matriculas.id })
    .from(matriculas)
    .where(
      and(
        eq(matriculas.grupoId, curso.grupoId),
        eq(matriculas.estudianteId, usuario.estudianteId)
      )
    )
    .limit(1);
  if (!matriculado) return "No estás matriculado en el grupo de esta evaluación.";

  let intentoId: string;
  try {
    const [intento] = await db
      .insert(intentos)
      .values({ evaluacionId, estudianteId: usuario.estudianteId })
      .returning({ id: intentos.id });
    intentoId = intento.id;
  } catch {
    return "Ya rendiste esta evaluación.";
  }

  const nuevasRespuestas: { intentoId: string; preguntaId: string; alternativaId: string }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("pregunta_")) continue;
    nuevasRespuestas.push({
      intentoId,
      preguntaId: key.slice("pregunta_".length),
      alternativaId: String(value),
    });
  }
  if (nuevasRespuestas.length) {
    await db.insert(respuestas).values(nuevasRespuestas);
  }

  // Califica enteramente en el servidor: el cliente nunca supo cuál
  // alternativa era la correcta hasta este momento.
  const [{ puntaje }] = await db
    .select({ puntaje: sql<number>`coalesce(sum(${preguntas.puntaje}), 0)`.mapWith(Number) })
    .from(respuestas)
    .innerJoin(preguntas, eq(preguntas.id, respuestas.preguntaId))
    .innerJoin(alternativas, eq(alternativas.id, respuestas.alternativaId))
    .where(and(eq(respuestas.intentoId, intentoId), eq(alternativas.esCorrecta, true)));

  await db
    .update(intentos)
    .set({ puntajeObtenido: String(puntaje), entregadoAt: new Date() })
    .where(eq(intentos.id, intentoId));

  revalidatePath("/portal/evaluaciones", "layout");
  return null;
}
