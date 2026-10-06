import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  preguntasEvalDocente,
  alternativasEvalDocente,
  evaluacionesDocente,
  respuestasEvalDocente,
  evaluacionDocenteConfig,
} from "@/lib/db/schema";
import type { PreguntaConConteo } from "@/components/evaluacion-docente-resultados";

// Sin fila = nunca se activó todavía, así que cuenta como desactivada.
export async function evaluacionDocenteEstaActiva(): Promise<boolean> {
  const [fila] = await db
    .select({ activo: evaluacionDocenteConfig.activo })
    .from(evaluacionDocenteConfig)
    .where(eq(evaluacionDocenteConfig.id, 1))
    .limit(1);
  return fila?.activo ?? false;
}

// Agrega las respuestas recibidas por un curso: conteo por alternativa de
// cada pregunta activa, más la lista de comentarios (sin vincular al
// alumno que lo dejó — la evaluación es anónima para el docente/admin).
export async function obtenerResultadosCurso(cursoId: string): Promise<{
  preguntas: PreguntaConConteo[];
  comentarios: string[];
  totalEnvios: number;
}> {
  const [preguntasBase, envios] = await Promise.all([
    db
      .select()
      .from(preguntasEvalDocente)
      .where(eq(preguntasEvalDocente.activo, true))
      .orderBy(asc(preguntasEvalDocente.orden)),
    db
      .select({ id: evaluacionesDocente.id, comentario: evaluacionesDocente.comentario })
      .from(evaluacionesDocente)
      .where(eq(evaluacionesDocente.cursoId, cursoId)),
  ]);

  const envioIds = envios.map((e) => e.id);

  const [alternativasBase, conteos] = await Promise.all([
    preguntasBase.length
      ? db
          .select()
          .from(alternativasEvalDocente)
          .where(
            inArray(
              alternativasEvalDocente.preguntaId,
              preguntasBase.map((p) => p.id)
            )
          )
          .orderBy(asc(alternativasEvalDocente.orden))
      : Promise.resolve([]),
    envioIds.length
      ? db
          .select({
            alternativaId: respuestasEvalDocente.alternativaId,
            cantidad: sql<number>`count(*)`.mapWith(Number),
          })
          .from(respuestasEvalDocente)
          .where(inArray(respuestasEvalDocente.evaluacionDocenteId, envioIds))
          .groupBy(respuestasEvalDocente.alternativaId)
      : Promise.resolve([]),
  ]);

  const conteoPorAlternativa = new Map(conteos.map((c) => [c.alternativaId, c.cantidad]));

  const preguntas: PreguntaConConteo[] = preguntasBase.map((p) => ({
    id: p.id,
    enunciado: p.enunciado,
    alternativas: alternativasBase
      .filter((a) => a.preguntaId === p.id)
      .map((a) => ({ id: a.id, texto: a.texto, conteo: conteoPorAlternativa.get(a.id) ?? 0 })),
  }));

  const comentarios = envios.map((e) => e.comentario).filter((c): c is string => !!c);

  return { preguntas, comentarios, totalEnvios: envios.length };
}
