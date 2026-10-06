import { notFound, redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { cursos } from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { obtenerResultadosCurso } from "@/lib/evaluacion-docente";
import { ResultadosEvaluacionDocente } from "@/components/evaluacion-docente-resultados";

export default async function EvaluacionDocentePage({
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

  const { preguntas, comentarios, totalEnvios } = await obtenerResultadosCurso(id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Evaluación de mis alumnos</h1>
        <p className="text-sm text-ink-soft">
          Cómo te evaluaron en este curso. Las respuestas son anónimas.
        </p>
      </div>

      <ResultadosEvaluacionDocente preguntas={preguntas} comentarios={comentarios} totalEnvios={totalEnvios} />
    </div>
  );
}
