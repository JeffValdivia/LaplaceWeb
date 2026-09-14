import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { sedes, asignaturas, grupos } from "@/lib/db/schema";
import { crearSede, crearAsignatura } from "./actions";

export default async function SedesPage() {
  const [listaSedes, listaAsignaturas] = await Promise.all([
    db
      .select({
        id: sedes.id,
        nombre: sedes.nombre,
        descripcion: sedes.descripcion,
        cantidadGrupos: sql<number>`count(${grupos.id})`.mapWith(Number),
      })
      .from(sedes)
      .leftJoin(grupos, eq(grupos.sedeId, sedes.id))
      .groupBy(sedes.id)
      .orderBy(asc(sedes.nombre)),
    db.select().from(asignaturas).orderBy(asc(asignaturas.nombre)),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-ink">Sedes y asignaturas</h1>
        <p className="text-sm text-ink-soft">
          Sede = el local de la academia (ej. UNSA, Canto, UNSA Virtual).
          Registra la sede y entra a ella para crear sus grupos. Un grupo
          combina una sede y una modalidad (presencial o virtual). Asignatura
          = la materia que se dicta dentro de un grupo, con su propio docente.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5">
          <h2 className="font-medium text-ink">Sedes</h2>
          <ul className="flex flex-col divide-y divide-line">
            {listaSedes.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div>
                  <Link
                    href={`/sedes/${s.id}`}
                    className="font-medium text-ink hover:text-brand-blue hover:underline"
                  >
                    {s.nombre}
                  </Link>
                  {s.descripcion && (
                    <p className="text-xs text-ink-soft">{s.descripcion}</p>
                  )}
                </div>
                <span className="font-mono-tab text-xs text-ink-soft">
                  {s.cantidadGrupos} grupo{s.cantidadGrupos === 1 ? "" : "s"}
                </span>
              </li>
            ))}
            {!listaSedes.length && (
              <li className="py-2 text-sm text-ink-soft">Todavía no hay sedes.</li>
            )}
          </ul>
          <form action={crearSede} className="flex flex-col gap-2 border-t border-line pt-4">
            <input
              name="nombre"
              required
              placeholder="Nombre de la sede"
              className="rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
            />
            <input
              name="descripcion"
              placeholder="Descripción (opcional)"
              className="rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
            />
            <button
              type="submit"
              className="self-start rounded-md bg-brand-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-blue"
            >
              Agregar sede
            </button>
          </form>
        </section>

        <section className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5">
          <h2 className="font-medium text-ink">Asignaturas</h2>
          <ul className="flex flex-col divide-y divide-line">
            {listaAsignaturas.map((a) => (
              <li key={a.id} className="py-2 text-sm font-medium text-ink">
                {a.nombre}
              </li>
            ))}
            {!listaAsignaturas.length && (
              <li className="py-2 text-sm text-ink-soft">Todavía no hay asignaturas.</li>
            )}
          </ul>
          <form action={crearAsignatura} className="flex flex-col gap-2 border-t border-line pt-4">
            <input
              name="nombre"
              required
              placeholder="Nombre de la asignatura"
              className="rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
            />
            <button
              type="submit"
              className="self-start rounded-md bg-brand-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-blue"
            >
              Agregar asignatura
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
