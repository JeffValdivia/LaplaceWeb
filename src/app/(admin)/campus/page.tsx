import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { recursos, cursos, grupos, sedes, asignaturas } from "@/lib/db/schema";
import { eliminarRecurso } from "@/lib/actions/campus";
import { SubirRecursoForm } from "./form";

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

export default async function CampusPage() {
  const [filas, listaCursos] = await Promise.all([
    db
      .select({
        id: recursos.id,
        titulo: recursos.titulo,
        descripcion: recursos.descripcion,
        archivoPath: recursos.archivoPath,
        enlaceUrl: recursos.enlaceUrl,
        createdAt: recursos.createdAt,
        grupoNombre: grupos.nombre,
        grupoModalidad: grupos.modalidad,
        sedeNombre: sedes.nombre,
        asignaturaNombre: asignaturas.nombre,
      })
      .from(recursos)
      .innerJoin(cursos, eq(cursos.id, recursos.cursoId))
      .innerJoin(grupos, eq(grupos.id, cursos.grupoId))
      .innerJoin(sedes, eq(sedes.id, grupos.sedeId))
      .innerJoin(asignaturas, eq(asignaturas.id, cursos.asignaturaId))
      .orderBy(desc(recursos.createdAt)),
    db
      .select({
        id: cursos.id,
        grupoNombre: grupos.nombre,
        grupoModalidad: grupos.modalidad,
        sedeNombre: sedes.nombre,
        asignaturaNombre: asignaturas.nombre,
      })
      .from(cursos)
      .innerJoin(grupos, eq(grupos.id, cursos.grupoId))
      .innerJoin(sedes, eq(sedes.id, grupos.sedeId))
      .innerJoin(asignaturas, eq(asignaturas.id, cursos.asignaturaId))
      .where(eq(grupos.activo, true))
      .orderBy(asc(grupos.nombre), asc(asignaturas.nombre)),
  ]);

  const opcionesCurso = listaCursos.map((c) => ({
    id: c.id,
    etiqueta: `${c.sedeNombre} · ${modalidadEtiqueta[c.grupoModalidad] ?? c.grupoModalidad} · ${c.grupoNombre} · ${c.asignaturaNombre}`,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Campus virtual y recursos</h1>
        <p className="text-sm text-ink-soft">
          Separatas y material de todos los grupos. Los docentes suben los
          suyos desde su propia área.
        </p>
      </div>

      <SubirRecursoForm cursos={opcionesCurso} />

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-soft">
              <th className="px-4 py-3 font-medium">Recurso</th>
              <th className="px-4 py-3 font-medium">Grupo</th>
              <th className="px-4 py-3 font-medium">Subido</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filas.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{r.titulo}</p>
                  {r.descripcion && (
                    <p className="text-xs text-ink-soft">{r.descripcion}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {r.sedeNombre} · {modalidadEtiqueta[r.grupoModalidad] ?? r.grupoModalidad} ·{" "}
                  {r.grupoNombre} · {r.asignaturaNombre}
                </td>
                <td className="px-4 py-3 font-mono-tab text-xs text-ink-soft">
                  {r.createdAt.toLocaleDateString("es-PE")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {r.archivoPath ? (
                      <a
                        href={`/api/recursos/${r.id}`}
                        className="text-xs font-medium text-brand-blue hover:underline"
                      >
                        Descargar
                      </a>
                    ) : (
                      r.enlaceUrl && (
                        <a
                          href={r.enlaceUrl}
                          target="_blank"
                          className="text-xs font-medium text-brand-blue hover:underline"
                        >
                          Ver enlace
                        </a>
                      )
                    )}
                    <form action={eliminarRecurso}>
                      <input type="hidden" name="id" value={r.id} />
                      <button
                        type="submit"
                        className="text-xs text-danger underline decoration-dotted hover:decoration-solid"
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {!filas.length && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-soft">
                  Todavía no hay recursos publicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
