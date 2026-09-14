import Link from "next/link";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { evaluaciones, cursos, grupos, sedes, asignaturas, usuarios, preguntas } from "@/lib/db/schema";
import { crearEvaluacion } from "@/lib/actions/evaluaciones";

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

export default async function EvaluacionesPage() {
  const [filas, listaCursos] = await Promise.all([
    db
      .select({
        id: evaluaciones.id,
        titulo: evaluaciones.titulo,
        disponibleDesde: evaluaciones.disponibleDesde,
        disponibleHasta: evaluaciones.disponibleHasta,
        grupoNombre: grupos.nombre,
        modalidad: grupos.modalidad,
        sedeNombre: sedes.nombre,
        asignaturaNombre: asignaturas.nombre,
        cantidadPreguntas: sql<number>`count(${preguntas.id})`.mapWith(Number),
      })
      .from(evaluaciones)
      .innerJoin(cursos, eq(cursos.id, evaluaciones.cursoId))
      .innerJoin(grupos, eq(grupos.id, cursos.grupoId))
      .innerJoin(sedes, eq(sedes.id, grupos.sedeId))
      .innerJoin(asignaturas, eq(asignaturas.id, cursos.asignaturaId))
      .leftJoin(preguntas, eq(preguntas.evaluacionId, evaluaciones.id))
      .groupBy(evaluaciones.id, grupos.nombre, grupos.modalidad, sedes.nombre, asignaturas.nombre)
      .orderBy(desc(evaluaciones.createdAt)),
    db
      .select({
        id: cursos.id,
        grupoNombre: grupos.nombre,
        modalidad: grupos.modalidad,
        sedeNombre: sedes.nombre,
        asignaturaNombre: asignaturas.nombre,
        docenteNombre: usuarios.nombreCompleto,
      })
      .from(cursos)
      .innerJoin(grupos, eq(grupos.id, cursos.grupoId))
      .innerJoin(sedes, eq(sedes.id, grupos.sedeId))
      .innerJoin(asignaturas, eq(asignaturas.id, cursos.asignaturaId))
      .innerJoin(usuarios, eq(usuarios.id, cursos.docenteId))
      .where(eq(grupos.activo, true))
      .orderBy(asc(grupos.nombre), asc(asignaturas.nombre)),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Evaluaciones virtuales</h1>
        <p className="text-sm text-ink-soft">
          Crea la evaluación aquí y entra a cada una para agregar sus preguntas
          y alternativas.
        </p>
      </div>

      <form
        action={crearEvaluacion}
        className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
            <span className="font-medium text-ink">Curso</span>
            <select
              name="curso_id"
              required
              defaultValue=""
              className="rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
            >
              <option value="" disabled>
                Selecciona…
              </option>
              {listaCursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.sedeNombre} · {modalidadEtiqueta[c.modalidad] ?? c.modalidad} ·{" "}
                  {c.grupoNombre} · {c.asignaturaNombre} ({c.docenteNombre})
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Título</span>
            <input
              name="titulo"
              required
              className="rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Disponible desde</span>
            <input
              type="datetime-local"
              name="disponible_desde"
              className="rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Disponible hasta</span>
            <input
              type="datetime-local"
              name="disponible_hasta"
              className="rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
            />
          </label>
        </div>
        <button
          type="submit"
          className="self-start rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue"
        >
          Crear evaluación
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-soft">
              <th className="px-4 py-3 font-medium">Evaluación</th>
              <th className="px-4 py-3 font-medium">Curso</th>
              <th className="px-4 py-3 font-medium">Preguntas</th>
              <th className="px-4 py-3 font-medium">Disponibilidad</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((ev) => (
              <tr key={ev.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/evaluaciones/${ev.id}`}
                    className="font-medium text-brand-blue hover:underline"
                  >
                    {ev.titulo}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {ev.sedeNombre} · {modalidadEtiqueta[ev.modalidad] ?? ev.modalidad} ·{" "}
                  {ev.grupoNombre} · {ev.asignaturaNombre}
                </td>
                <td className="px-4 py-3 font-mono-tab text-ink-soft">
                  {ev.cantidadPreguntas}
                </td>
                <td className="px-4 py-3 text-xs text-ink-soft">
                  {ev.disponibleDesde
                    ? ev.disponibleDesde.toLocaleDateString("es-PE")
                    : "—"}{" "}
                  →{" "}
                  {ev.disponibleHasta
                    ? ev.disponibleHasta.toLocaleDateString("es-PE")
                    : "sin límite"}
                </td>
              </tr>
            ))}
            {!filas.length && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-soft">
                  Todavía no hay evaluaciones creadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
