import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { grupos, sedes, cursos, asignaturas, usuarios } from "@/lib/db/schema";
import { agregarCurso, quitarCurso } from "../actions";
import { DocenteCursoSelect } from "./docente-curso-select";

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
    db.select().from(asignaturas).where(eq(asignaturas.activo, true)).orderBy(asc(asignaturas.nombre)),
    db
      .select({ id: usuarios.id, nombreCompleto: usuarios.nombreCompleto })
      .from(usuarios)
      .where(eq(usuarios.rol, "docente"))
      .orderBy(asc(usuarios.nombreCompleto)),
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
                    docentes={listaDocentes}
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
          Todavía no registraste ningún docente. Ve a{" "}
          <Link href="/roles" className="underline">
            Seguridad y roles
          </Link>{" "}
          para darle acceso a uno.
        </p>
      )}

      {!listaAsignaturas.length && (
        <p className="rounded-lg border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
          Todavía no registraste ninguna asignatura. Ve a{" "}
          <Link href="/sedes" className="underline">
            Sedes y asignaturas
          </Link>{" "}
          para crear una.
        </p>
      )}

      {!!asignaturasDisponibles.length && !!listaDocentes.length && (
        <form
          action={agregarCurso}
          className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5 sm:flex-row sm:items-end sm:flex-wrap"
        >
          <input type="hidden" name="grupo_id" value={id} />
          <label className="flex flex-1 flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Asignatura</span>
            <select
              name="asignatura_id"
              required
              defaultValue=""
              className="rounded-md border border-line bg-bg px-3 py-2 outline-none focus:border-brand-blue"
            >
              <option value="" disabled>
                Selecciona…
              </option>
              {asignaturasDisponibles.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Docente</span>
            <select
              name="docente_id"
              required
              defaultValue=""
              className="rounded-md border border-line bg-bg px-3 py-2 outline-none focus:border-brand-blue"
            >
              <option value="" disabled>
                Selecciona…
              </option>
              {listaDocentes.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombreCompleto}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue"
          >
            Agregar asignatura al grupo
          </button>
        </form>
      )}
    </div>
  );
}
