import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { cursos, grupos, asignaturas } from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";

export default async function CursoDocentePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");

  const { id } = await params;

  const [curso] = await db
    .select({
      id: cursos.id,
      grupoId: cursos.grupoId,
      grupoNombre: grupos.nombre,
      asignaturaNombre: asignaturas.nombre,
    })
    .from(cursos)
    .innerJoin(grupos, eq(grupos.id, cursos.grupoId))
    .innerJoin(asignaturas, eq(asignaturas.id, cursos.asignaturaId))
    .where(and(eq(cursos.id, id), eq(cursos.docenteId, usuario.id)))
    .limit(1);

  if (!curso) notFound();

  const enlaces = [
    { href: `/docente/cursos/${id}/recursos`, label: "Campus virtual" },
    { href: `/docente/cursos/${id}/evaluaciones`, label: "Evaluaciones" },
    { href: `/docente/cursos/${id}/asistencia`, label: "Asistencia" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/docente/grupos/${curso.grupoId}`}
          className="text-sm text-brand-blue hover:underline"
        >
          ← {curso.grupoNombre}
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-ink">{curso.asignaturaNombre}</h1>
        <p className="text-sm text-ink-soft">{curso.grupoNombre}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {enlaces.map((e) => (
          <Link
            key={e.href}
            href={e.href}
            className="rounded-lg border border-line bg-surface p-4 text-center font-medium text-ink transition hover:border-brand-blue hover:text-brand-blue"
          >
            {e.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
