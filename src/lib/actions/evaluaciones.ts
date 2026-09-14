"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { evaluaciones, preguntas, alternativas, cursos } from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";

export async function crearEvaluacion(formData: FormData) {
  const usuario = await obtenerUsuarioActual();
  const cursoId = String(formData.get("curso_id") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;
  const disponibleDesde = String(formData.get("disponible_desde") ?? "") || null;
  const disponibleHasta = String(formData.get("disponible_hasta") ?? "") || null;

  if (!cursoId || !titulo || !usuario) return;

  if (usuario.rol === "docente") {
    const [curso] = await db
      .select({ id: cursos.id })
      .from(cursos)
      .where(and(eq(cursos.id, cursoId), eq(cursos.docenteId, usuario.id)))
      .limit(1);
    if (!curso) return;
  } else if (usuario.rol !== "admin") {
    return;
  }

  await db.insert(evaluaciones).values({
    cursoId,
    titulo,
    descripcion,
    disponibleDesde: disponibleDesde ? new Date(disponibleDesde) : undefined,
    disponibleHasta: disponibleHasta ? new Date(disponibleHasta) : undefined,
    creadoPor: usuario.id,
  });

  revalidatePath("/", "layout");
}

export async function crearPregunta(formData: FormData) {
  const evaluacionId = String(formData.get("evaluacion_id") ?? "");
  const enunciado = String(formData.get("enunciado") ?? "").trim();
  const puntaje = String(formData.get("puntaje") ?? "1");
  if (!evaluacionId || !enunciado) return;

  await db.insert(preguntas).values({ evaluacionId, enunciado, puntaje });
  revalidatePath("/", "layout");
}

export async function crearAlternativa(formData: FormData) {
  const preguntaId = String(formData.get("pregunta_id") ?? "");
  const texto = String(formData.get("texto") ?? "").trim();
  const esCorrecta = formData.get("es_correcta") === "on";
  if (!preguntaId || !texto) return;

  await db.insert(alternativas).values({ preguntaId, texto, esCorrecta });
  revalidatePath("/", "layout");
}
