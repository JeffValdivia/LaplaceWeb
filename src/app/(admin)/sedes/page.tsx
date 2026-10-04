import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { sedes, asignaturas, grupos, cursos, usuarios } from "@/lib/db/schema";
import { listarDocentes } from "@/lib/docentes";
import { aplicarDocenteACursos } from "./actions";
import { NuevaAsignaturaForm, DocenteAsignaturaSelect } from "./asignatura-forms";

export default async function SedesPage() {
  const [listaSedes, filasAsignaturas, listaDocentes] = await Promise.all([
    db
      .select({
        id: sedes.id,
        nombre: sedes.nombre,
        descripcion: sedes.descripcion,
        cantidadGrupos: sql<number>`count(distinct ${grupos.id})`.mapWith(Number),
      })
      .from(sedes)
      .leftJoin(grupos, eq(grupos.sedeId, sedes.id))
      .groupBy(sedes.id)
      .orderBy(asc(sedes.nombre)),
    db
      .select({
        id: asignaturas.id,
        nombre: asignaturas.nombre,
        sedeId: asignaturas.sedeId,
        docenteId: asignaturas.docenteId,
        grupoNombre: grupos.nombre,
        cursoDocenteId: cursos.docenteId,
        cursoDocenteNombre: usuarios.nombreCompleto,
      })
      .from(asignaturas)
      .leftJoin(cursos, eq(cursos.asignaturaId, asignaturas.id))
      .leftJoin(grupos, eq(grupos.id, cursos.grupoId))
      .leftJoin(usuarios, eq(usuarios.id, cursos.docenteId))
      .orderBy(asc(asignaturas.nombre)),
    listarDocentes(),
  ]);

  // Cada asignatura puede salir en varias filas (una por curso/grupo que la
  // dicta); se agrupan aquí para mostrar todos sus cursos juntos.
  type Dictado = { grupoNombre: string; docenteId: string; docenteNombre: string };
  const asignaturasPorId = new Map<
    string,
    { id: string; nombre: string; sedeId: string; docenteId: string | null; dictados: Dictado[] }
  >();
  for (const fila of filasAsignaturas) {
    let entrada = asignaturasPorId.get(fila.id);
    if (!entrada) {
      entrada = {
        id: fila.id,
        nombre: fila.nombre,
        sedeId: fila.sedeId,
        docenteId: fila.docenteId,
        dictados: [],
      };
      asignaturasPorId.set(fila.id, entrada);
    }
    if (fila.grupoNombre && fila.cursoDocenteId && fila.cursoDocenteNombre) {
      entrada.dictados.push({
        grupoNombre: fila.grupoNombre,
        docenteId: fila.cursoDocenteId,
        docenteNombre: fila.cursoDocenteNombre,
      });
    }
  }
  const listaAsignaturas = [...asignaturasPorId.values()];
  const docentesOpciones = listaDocentes.map((d) => ({
    id: d.id,
    nombreCompleto: d.nombreCompleto,
    sedeId: d.sedeId,
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-ink">Asignaturas</h1>
        <p className="text-sm text-ink-soft">
          Cada asignatura es propia de una sede y puede tener un docente
          predeterminado: al agregarla a un grupo, ese docente se propone
          solo (se puede cambiar en cada curso).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5">
          <h2 className="font-medium text-ink">Sedes</h2>
          <ul className="flex flex-col divide-y divide-line">
            {listaSedes.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <Link
                  href={`/sedes/${s.id}`}
                  className="font-medium text-ink hover:text-brand-blue hover:underline"
                >
                  {s.nombre}
                </Link>
                <span className="font-mono-tab text-xs text-ink-soft">
                  {s.cantidadGrupos} grupo{s.cantidadGrupos === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5">
          <h2 className="font-medium text-ink">Nueva asignatura</h2>
          <NuevaAsignaturaForm
            sedes={listaSedes.map((s) => ({ id: s.id, nombre: s.nombre }))}
            docentes={docentesOpciones}
          />
        </section>
      </div>

      <div className="flex flex-col gap-6">
        {listaSedes.map((sede) => {
          const asignaturasDeLaSede = listaAsignaturas.filter((a) => a.sedeId === sede.id);
          return (
            <section
              key={sede.id}
              className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5"
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">
                {sede.nombre}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-soft">
                      <th className="px-3 py-2 font-medium">Asignatura</th>
                      <th className="px-3 py-2 font-medium">Docente predeterminado</th>
                      <th className="px-3 py-2 font-medium">Cursos (grupo · docente)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asignaturasDeLaSede.map((a) => {
                      const hayCursosConOtroDocente =
                        !!a.docenteId && a.dictados.some((d) => d.docenteId !== a.docenteId);
                      return (
                        <tr key={a.id} className="border-b border-line align-top last:border-0">
                          <td className="px-3 py-2 font-medium text-ink">{a.nombre}</td>
                          <td className="px-3 py-2">
                            <DocenteAsignaturaSelect
                              asignaturaId={a.id}
                              sedeId={a.sedeId}
                              docenteIdActual={a.docenteId}
                              docentes={docentesOpciones}
                            />
                          </td>
                          <td className="px-3 py-2">
                            {a.dictados.length ? (
                              <div className="flex flex-col items-start gap-1.5">
                                <div className="flex flex-wrap gap-1.5">
                                  {a.dictados.map((d, i) => (
                                    <span
                                      key={i}
                                      className="rounded-full bg-brand-blue-light/20 px-2.5 py-0.5 text-xs font-medium text-brand-blue"
                                    >
                                      {d.grupoNombre} · {d.docenteNombre}
                                    </span>
                                  ))}
                                </div>
                                {hayCursosConOtroDocente && (
                                  <form action={aplicarDocenteACursos}>
                                    <input type="hidden" name="asignatura_id" value={a.id} />
                                    <button
                                      type="submit"
                                      className="text-xs font-medium text-brand-blue underline decoration-dotted hover:decoration-solid"
                                    >
                                      Aplicar el docente predeterminado a estos cursos
                                    </button>
                                  </form>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs italic text-ink-soft">
                                Sin curso asignado todavía
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {!asignaturasDeLaSede.length && (
                      <tr>
                        <td colSpan={3} className="px-3 py-4 text-center text-ink-soft">
                          Esta sede todavía no tiene asignaturas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
