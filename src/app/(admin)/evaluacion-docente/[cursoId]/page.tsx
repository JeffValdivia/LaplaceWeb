import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cursos, grupos, sedes, asignaturas, usuarios } from "@/lib/db/schema";
import { obtenerResultadosCurso } from "@/lib/evaluacion-docente";
import { ResultadosEvaluacionDocente } from "@/components/evaluacion-docente-resultados";

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

export default async function EvaluacionDocenteResultadosPage({
  params,
}: {
  params: Promise<{ cursoId: string }>;
}) {
  const { cursoId } = await params;

  const [curso] = await db
    .select({
      id: cursos.id,
      grupoNombre: grupos.nombre,
      modalidad: grupos.modalidad,
      sedeNombre: sedes.nombre,
      asignaturaNombre: asignaturas.nombre,
      docenteNombre: usuarios.nombreCompleto,
    })
    .from(cursos)
    .leftJoin(grupos, eq(grupos.id, cursos.grupoId))
    .leftJoin(sedes, eq(sedes.id, grupos.sedeId))
    .innerJoin(asignaturas, eq(asignaturas.id, cursos.asignaturaId))
    .innerJoin(usuarios, eq(usuarios.id, cursos.docenteId))
    .where(eq(cursos.id, cursoId))
    .limit(1);

  if (!curso) notFound();

  const { preguntas, comentarios, totalEnvios } = await obtenerResultadosCurso(cursoId);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/evaluacion-docente" className="text-sm text-brand-blue hover:underline">
          ← Evaluación a docente
        </Link>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
          {curso.asignaturaNombre}
        </h1>
        <p className="text-sm text-ink-soft">
          {curso.grupoNombre ? (
            <>
              {curso.sedeNombre} · {modalidadEtiqueta[curso.modalidad ?? ""] ?? curso.modalidad} ·{" "}
              {curso.grupoNombre} ·{" "}
            </>
          ) : (
            <span className="italic">Sin grupo · </span>
          )}
          Docente: {curso.docenteNombre}
        </p>
      </div>

      <ResultadosEvaluacionDocente preguntas={preguntas} comentarios={comentarios} totalEnvios={totalEnvios} />
    </div>
  );
}
