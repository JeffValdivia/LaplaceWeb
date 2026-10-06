"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { evaluaciones, preguntas, alternativas, cursos } from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";

// Admin puede tocar cualquier curso; un docente solo el suyo. Devuelve si
// el usuario actual tiene permiso para modificar el curso dueño de esta
// evaluación — se usa antes de insertar preguntas o alternativas, porque
// esas acciones no reciben el curso_id directamente del formulario.
async function puedeEditarEvaluacion(evaluacionId: string) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return false;
  if (usuario.rol === "admin") return true;
  if (usuario.rol !== "docente") return false;

  const [fila] = await db
    .select({ id: evaluaciones.id })
    .from(evaluaciones)
    .innerJoin(cursos, eq(cursos.id, evaluaciones.cursoId))
    .where(and(eq(evaluaciones.id, evaluacionId), eq(cursos.docenteId, usuario.id)))
    .limit(1);
  return Boolean(fila);
}

export async function crearEvaluacion(formData: FormData) {
  const usuario = await obtenerUsuarioActual();
  const cursoId = String(formData.get("curso_id") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;
  const disponibleDesde = String(formData.get("disponible_desde") ?? "") || null;
  const disponibleHasta = String(formData.get("disponible_hasta") ?? "") || null;
  const duracionMinutosRaw = String(formData.get("duracion_minutos") ?? "").trim();
  const duracionMinutos =
    duracionMinutosRaw && Number(duracionMinutosRaw) > 0 ? Math.floor(Number(duracionMinutosRaw)) : null;

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
    duracionMinutos,
    creadoPor: usuario.id,
  });

  revalidatePath("/", "layout");
}

export async function crearPregunta(formData: FormData) {
  const evaluacionId = String(formData.get("evaluacion_id") ?? "");
  const enunciado = String(formData.get("enunciado") ?? "").trim();
  const puntaje = String(formData.get("puntaje") ?? "1");
  if (!evaluacionId || !enunciado) return;
  if (!(await puedeEditarEvaluacion(evaluacionId))) return;

  await db.insert(preguntas).values({ evaluacionId, enunciado, puntaje });
  revalidatePath("/", "layout");
}

export async function crearAlternativa(formData: FormData) {
  const preguntaId = String(formData.get("pregunta_id") ?? "");
  const texto = String(formData.get("texto") ?? "").trim();
  const esCorrecta = formData.get("es_correcta") === "on";
  if (!preguntaId || !texto) return;

  const [pregunta] = await db
    .select({ evaluacionId: preguntas.evaluacionId })
    .from(preguntas)
    .where(eq(preguntas.id, preguntaId))
    .limit(1);
  if (!pregunta || !(await puedeEditarEvaluacion(pregunta.evaluacionId))) return;

  await db.insert(alternativas).values({ preguntaId, texto, esCorrecta });
  revalidatePath("/", "layout");
}
