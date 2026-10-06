import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { avancesClase, avancesAdjuntos, cursos, grupos, asignaturas, usuarios } from "@/lib/db/schema";
import { AvanceForm } from "@/app/(docente)/docente/cursos/[id]/avance/form";
import { AvanceEntry, type AdjuntoAvance } from "@/app/(docente)/docente/cursos/[id]/avance/avance-entry";

export default async function AvanceAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [curso] = await db
    .select({
      id: cursos.id,
      grupoId: cursos.grupoId,
      grupoNombre: grupos.nombre,
      asignaturaNombre: asignaturas.nombre,
      docenteNombre: usuarios.nombreCompleto,
    })
    .from(cursos)
    .leftJoin(grupos, eq(grupos.id, cursos.grupoId))
    .innerJoin(asignaturas, eq(asignaturas.id, cursos.asignaturaId))
    .innerJoin(usuarios, eq(usuarios.id, cursos.docenteId))
    .where(eq(cursos.id, id))
    .limit(1);

  if (!curso) notFound();

  const filas = await db
    .select()
    .from(avancesClase)
    .where(eq(avancesClase.cursoId, id))
    .orderBy(desc(avancesClase.fecha), desc(avancesClase.createdAt));

  const avanceIds = filas.map((f) => f.id);
  const adjuntosCrudos = avanceIds.length
    ? await db
        .select({
          id: avancesAdjuntos.id,
          avanceId: avancesAdjuntos.avanceId,
          nombre: avancesAdjuntos.nombre,
          tipo: avancesAdjuntos.tipo,
        })
        .from(avancesAdjuntos)
        .where(inArray(avancesAdjuntos.avanceId, avanceIds))
    : [];

  const adjuntosPorAvance = new Map<string, AdjuntoAvance[]>();
  for (const a of adjuntosCrudos) {
    const lista = adjuntosPorAvance.get(a.avanceId) ?? [];
    lista.push({
      id: a.id,
      nombre: a.nombre,
      tipo: a.tipo as "imagen" | "archivo",
      url: `/api/avance-adjuntos/${a.id}`,
    });
    adjuntosPorAvance.set(a.avanceId, lista);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={curso.grupoId ? `/grupos/${curso.grupoId}` : "/grupos"}
          className="text-sm text-brand-blue hover:underline"
        >
          ← {curso.grupoNombre ?? "Grupos académicos"}
        </Link>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
          {curso.asignaturaNombre}
        </h1>
        <p className="text-sm text-ink-soft">
          {curso.grupoNombre ?? "Sin grupo"} · Docente: {curso.docenteNombre}
        </p>
      </div>

      <AvanceForm cursoId={id} />

      <div className="flex flex-col gap-3">
        {filas.map((f, i) => (
          <AvanceEntry
            key={f.id}
            avance={f}
            numeroSesion={filas.length - i}
            adjuntos={adjuntosPorAvance.get(f.id) ?? []}
          />
        ))}
        {!filas.length && (
          <p className="rounded-lg border border-line bg-surface px-4 py-6 text-center text-sm text-ink-soft">
            Este docente todavía no registró ninguna clase dictada.
          </p>
        )}
      </div>
    </div>
  );
}
