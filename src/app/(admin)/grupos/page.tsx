import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { grupos, sedes, cursos } from "@/lib/db/schema";
import { GrupoFila } from "./grupo-fila";

export default async function GruposPage() {
  const listaGrupos = await db
    .select({
      id: grupos.id,
      nombre: grupos.nombre,
      modalidad: grupos.modalidad,
      sedeId: sedes.id,
      sedeNombre: sedes.nombre,
      cantidadCursos: sql<number>`count(${cursos.id})`.mapWith(Number),
    })
    .from(grupos)
    .innerJoin(sedes, eq(sedes.id, grupos.sedeId))
    .leftJoin(cursos, eq(cursos.grupoId, grupos.id))
    .groupBy(grupos.id, sedes.id, sedes.nombre)
    .orderBy(asc(sedes.nombre), asc(grupos.nombre));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-ink">Grupos académicos</h1>
        <p className="text-sm text-ink-soft">
          Vista general de todos los grupos. Para crear uno nuevo, entra a su
          sede desde{" "}
          <a href="/sedes" className="underline">
            Asignaturas
          </a>
          .
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-soft">
              <th className="px-4 py-3 font-medium">Grupo</th>
              <th className="px-4 py-3 font-medium">Sede</th>
              <th className="px-4 py-3 font-medium">Modalidad</th>
              <th className="px-4 py-3 font-medium">Cursos</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {listaGrupos.map((g) => (
              <GrupoFila key={g.id} grupo={g} />
            ))}
            {!listaGrupos.length && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-soft">
                  Todavía no hay grupos académicos. Entra a una sede para crear el primero.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
