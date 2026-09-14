import { redirect } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { recursos, matriculas, cursos, asignaturas } from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";

export default async function RecursosPortalPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario?.estudianteId) redirect("/login");

  const misGrupos = await db
    .select({ grupoId: matriculas.grupoId })
    .from(matriculas)
    .where(eq(matriculas.estudianteId, usuario.estudianteId));

  const grupoIds = misGrupos.map((g) => g.grupoId);

  const misCursos = grupoIds.length
    ? await db.select({ id: cursos.id }).from(cursos).where(inArray(cursos.grupoId, grupoIds))
    : [];
  const cursoIds = misCursos.map((c) => c.id);

  const filas = cursoIds.length
    ? await db
        .select({
          id: recursos.id,
          titulo: recursos.titulo,
          descripcion: recursos.descripcion,
          archivoPath: recursos.archivoPath,
          enlaceUrl: recursos.enlaceUrl,
          createdAt: recursos.createdAt,
          asignaturaNombre: asignaturas.nombre,
        })
        .from(recursos)
        .innerJoin(cursos, eq(cursos.id, recursos.cursoId))
        .innerJoin(asignaturas, eq(asignaturas.id, cursos.asignaturaId))
        .where(inArray(recursos.cursoId, cursoIds))
        .orderBy(desc(recursos.createdAt))
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Campus virtual</h1>
        <p className="text-sm text-ink-soft">Material publicado por tu docente.</p>
      </div>

      <div className="flex flex-col gap-3">
        {filas.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-line bg-surface p-4"
          >
            <div>
              <span className="mb-1 inline-block rounded-full bg-brand-blue-light/20 px-2 py-0.5 text-xs font-medium text-brand-blue">
                {r.asignaturaNombre}
              </span>
              <p className="font-medium text-ink">{r.titulo}</p>
              {r.descripcion && <p className="text-sm text-ink-soft">{r.descripcion}</p>}
            </div>
            {r.archivoPath ? (
              <a
                href={`/api/recursos/${r.id}`}
                className="shrink-0 rounded-md bg-brand-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-blue"
              >
                Descargar
              </a>
            ) : (
              r.enlaceUrl && (
                <a
                  href={r.enlaceUrl}
                  target="_blank"
                  className="shrink-0 rounded-md bg-brand-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-blue"
                >
                  Ver enlace
                </a>
              )
            )}
          </div>
        ))}
        {!filas.length && (
          <p className="rounded-lg border border-line bg-surface px-4 py-6 text-center text-sm text-ink-soft">
            Todavía no hay recursos publicados para tu grupo.
          </p>
        )}
      </div>
    </div>
  );
}
