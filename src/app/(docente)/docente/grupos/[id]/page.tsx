import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { asc, and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { grupos, sedes, matriculas, estudiantes, cursos, asignaturas } from "@/lib/db/schema";
import { calcularEstado } from "@/lib/vigencia";
import { obtenerUsuarioActual } from "@/lib/auth/session";

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

export default async function GrupoDocentePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");

  const { id } = await params;

  const [grupo] = await db
    .select({
      id: grupos.id,
      nombre: grupos.nombre,
      modalidad: grupos.modalidad,
      sedeNombre: sedes.nombre,
    })
    .from(grupos)
    .innerJoin(sedes, eq(sedes.id, grupos.sedeId))
    .where(eq(grupos.id, id))
    .limit(1);

  if (!grupo) notFound();

  const cursosDelDocente = await db
    .select({ id: cursos.id, asignaturaNombre: asignaturas.nombre })
    .from(cursos)
    .innerJoin(asignaturas, eq(asignaturas.id, cursos.asignaturaId))
    .where(and(eq(cursos.grupoId, id), eq(cursos.docenteId, usuario.id)))
    .orderBy(asc(asignaturas.nombre));

  if (!cursosDelDocente.length) notFound();

  const matriculados = await db
    .select({
      estudianteId: estudiantes.id,
      dni: estudiantes.dni,
      nombres: estudiantes.nombres,
      apellidos: estudiantes.apellidos,
      fechaFin: matriculas.fechaFin,
      retirada: matriculas.retirada,
    })
    .from(matriculas)
    .innerJoin(estudiantes, eq(estudiantes.id, matriculas.estudianteId))
    .where(eq(matriculas.grupoId, id))
    .orderBy(asc(estudiantes.apellidos));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/docente" className="text-sm text-brand-blue hover:underline">
          ← Mis grupos
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-ink">{grupo.nombre}</h1>
        <p className="text-sm text-ink-soft">
          {grupo.sedeNombre} · {modalidadEtiqueta[grupo.modalidad] ?? grupo.modalidad} ·{" "}
          {matriculados.length} estudiantes
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cursosDelDocente.map((c) => (
          <Link
            key={c.id}
            href={`/docente/cursos/${c.id}`}
            className="rounded-lg border border-line bg-surface p-4 text-center font-medium text-ink transition hover:border-brand-blue hover:text-brand-blue"
          >
            {c.asignaturaNombre}
          </Link>
        ))}
        <Link
          href={`/docente/grupos/${id}/comunicados`}
          className="rounded-lg border border-line bg-surface p-4 text-center font-medium text-ink transition hover:border-brand-blue hover:text-brand-blue"
        >
          Comunicados
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-soft">
              <th className="px-4 py-3 font-medium">DNI</th>
              <th className="px-4 py-3 font-medium">Estudiante</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {matriculados.map((m) => (
              <tr key={m.estudianteId} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-mono-tab text-ink-soft">{m.dni}</td>
                <td className="px-4 py-3 text-ink">
                  {m.nombres} {m.apellidos}
                </td>
                <td className="px-4 py-3 text-xs text-ink-soft">
                  {calcularEstado(m.fechaFin, m.retirada)}
                </td>
              </tr>
            ))}
            {!matriculados.length && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-ink-soft">
                  Sin estudiantes matriculados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
