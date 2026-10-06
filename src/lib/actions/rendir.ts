"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { evaluaciones, matriculas, intentos, respuestas, preguntas, alternativas, cursos } from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { evaluacionAbierta } from "@/lib/evaluacion-estado";

async function verificarMatriculaYVentana(evaluacionId: string, estudianteId: string) {
  const [evaluacion] = await db
    .select()
    .from(evaluaciones)
    .where(eq(evaluaciones.id, evaluacionId))
    .limit(1);
  if (!evaluacion) return { error: "Esa evaluación no existe." } as const;
  if (!evaluacionAbierta(evaluacion.disponibleDesde, evaluacion.disponibleHasta)) {
    return { error: "Esta evaluación no está disponible en este momento." } as const;
  }

  const [curso] = await db
    .select({ grupoId: cursos.grupoId })
    .from(cursos)
    .where(eq(cursos.id, evaluacion.cursoId))
    .limit(1);
  if (!curso || !curso.grupoId) return { error: "Ese curso ya no tiene un grupo asociado." } as const;

  const [matriculado] = await db
    .select({ id: matriculas.id })
    .from(matriculas)
    .where(and(eq(matriculas.grupoId, curso.grupoId), eq(matriculas.estudianteId, estudianteId)))
    .limit(1);
  if (!matriculado) return { error: "No estás matriculado en el grupo de esta evaluación." } as const;

  return { evaluacion } as const;
}

// Arranca el cronómetro: crea el intento con iniciadoAt = ahora. A partir de
// aquí la evaluación muestra el formulario con el tiempo corriendo (si la
// evaluación tiene duracionMinutos), y ya no se puede "reiniciar" el reloj.
export async function iniciarIntento(formData: FormData) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario || usuario.rol !== "estudiante" || !usuario.estudianteId) return;

  const evaluacionId = String(formData.get("evaluacion_id") ?? "");
  if (!evaluacionId) return;

  const resultado = await verificarMatriculaYVentana(evaluacionId, usuario.estudianteId);
  if ("error" in resultado) return;

  try {
    await db.insert(intentos).values({ evaluacionId, estudianteId: usuario.estudianteId });
  } catch {
    // Ya existe un intento (iniciado o entregado) — seguimos igual, la
    // página vuelve a leer su estado actual.
  }

  revalidatePath(`/portal/evaluaciones/${evaluacionId}`);
  redirect(`/portal/evaluaciones/${evaluacionId}`);
}

export async function entregarIntento(_prevState: string | null, formData: FormData) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario || usuario.rol !== "estudiante" || !usuario.estudianteId) {
    return "No pudimos identificar tu matrícula.";
  }

  const evaluacionId = String(formData.get("evaluacion_id") ?? "");
  if (!evaluacionId) return "Falta la evaluación.";

  const [intento] = await db
    .select()
    .from(intentos)
    .where(and(eq(intentos.evaluacionId, evaluacionId), eq(intentos.estudianteId, usuario.estudianteId)))
    .limit(1);
  if (!intento) return "Primero debes iniciar el intento.";
  if (intento.entregadoAt) return "Ya rendiste esta evaluación.";

  const nuevasRespuestas: { intentoId: string; preguntaId: string; alternativaId: string }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("pregunta_")) continue;
    nuevasRespuestas.push({
      intentoId: intento.id,
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
    .where(and(eq(respuestas.intentoId, intento.id), eq(alternativas.esCorrecta, true)));

  await db
    .update(intentos)
    .set({ puntajeObtenido: String(puntaje), entregadoAt: new Date() })
    .where(eq(intentos.id, intento.id));

  revalidatePath("/portal/evaluaciones", "layout");
  return null;
}
