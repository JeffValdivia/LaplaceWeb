import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { grupos, sedes, cursos, asignaturas, usuarios } from "@/lib/db/schema";
import { listarDocentes } from "@/lib/docentes";
import { quitarCurso } from "../actions";
import { DocenteCursoSelect } from "./docente-curso-select";
import { AgregarCursoForm } from "./agregar-curso-form";

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

export default async function GrupoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [grupo] = await db
    .select({
      id: grupos.id,
      nombre: grupos.nombre,
      modalidad: grupos.modalidad,
      sedeId: grupos.sedeId,
      sedeNombre: sedes.nombre,
    })
    .from(grupos)
    .innerJoin(sedes, eq(sedes.id, grupos.sedeId))
    .where(eq(grupos.id, id))
    .limit(1);

  if (!grupo) notFound();

  const [listaCursos, listaAsignaturas, listaDocentes] = await Promise.all([
    db
      .select({
        id: cursos.id,
        asignaturaNombre: asignaturas.nombre,
        docenteId: usuarios.id,
        docenteNombre: usuarios.nombreCompleto,
      })
      .from(cursos)
      .innerJoin(asignaturas, eq(asignaturas.id, cursos.asignaturaId))
      .innerJoin(usuarios, eq(usuarios.id, cursos.docenteId))
      .where(eq(cursos.grupoId, id))
      .orderBy(asc(asignaturas.nombre)),
    db
      .select()
      .from(asignaturas)
      .where(and(eq(asignaturas.activo, true), eq(asignaturas.sedeId, grupo.sedeId)))
      .orderBy(asc(asignaturas.nombre)),
    listarDocentes(grupo.sedeId),
  ]);

  const asignaturasUsadas = new Set(listaCursos.map((c) => c.asignaturaNombre));
  const asignaturasDisponibles = listaAsignaturas.filter((a) => !asignaturasUsadas.has(a.nombre));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/grupos" className="text-sm text-brand-blue hover:underline">
          ← Grupos académicos
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-ink">{grupo.nombre}</h1>
        <p className="text-sm text-ink-soft">
          {grupo.sedeNombre} · {modalidadEtiqueta[grupo.modalidad] ?? grupo.modalidad}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-soft">
              <th className="px-4 py-3 font-medium">Asignatura</th>
              <th className="px-4 py-3 font-medium">Docente</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {listaCursos.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{c.asignaturaNombre}</td>
                <td className="px-4 py-3">
                  <DocenteCursoSelect
                    cursoId={c.id}
                    grupoId={id}
                    docenteIdActual={c.docenteId}
                    docentes={
                      // Si el curso quedó con un docente de otra sede (asignado
                      // antes de este filtro), se sigue mostrando para no
                      // aparentar que tiene otro.
                      listaDocentes.some((d) => d.id === c.docenteId)
                        ? listaDocentes
                        : [...listaDocentes, { id: c.docenteId, nombreCompleto: `${c.docenteNombre} (otra sede)` }]
                    }
                  />
                </td>
                <td className="px-4 py-3">
                  <form action={quitarCurso}>
                    <input type="hidden" name="curso_id" value={c.id} />
                    <input type="hidden" name="grupo_id" value={id} />
                    <button
                      type="submit"
                      className="text-xs text-danger underline decoration-dotted hover:decoration-solid"
                    >
                      Quitar
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {!listaCursos.length && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-ink-soft">
                  Este grupo todavía no tiene asignaturas asignadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!listaDocentes.length && (
        <p className="rounded-lg border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
          {grupo.sedeNombre} todavía no tiene docentes asignados. Ve a{" "}
          <Link href="/roles" className="underline">
            Seguridad y roles
          </Link>{" "}
          para crear uno o asignarle esta sede.
        </p>
      )}

      {!listaAsignaturas.length && (
        <p className="rounded-lg border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
          {grupo.sedeNombre} todavía no tiene asignaturas registradas. Ve a{" "}
          <Link href="/sedes" className="underline">
            Asignaturas
          </Link>{" "}
          para crear una en esta sede.
        </p>
      )}

      {!!asignaturasDisponibles.length && !!listaDocentes.length && (
        <AgregarCursoForm
          grupoId={id}
          asignaturas={asignaturasDisponibles.map((a) => ({
            id: a.id,
            nombre: a.nombre,
            docenteId: a.docenteId,
          }))}
          docentes={listaDocentes}
        />
      )}
    </div>
  );
}
