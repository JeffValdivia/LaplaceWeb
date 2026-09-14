import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { grupos, sedes, cursos } from "@/lib/db/schema";

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

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
          <Link href="/sedes" className="underline">
            Sedes y asignaturas
          </Link>
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
              <tr key={g.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{g.nombre}</td>
                <td className="px-4 py-3 text-ink-soft">
                  <Link href={`/sedes/${g.sedeId}`} className="hover:text-brand-blue hover:underline">
                    {g.sedeNombre}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {modalidadEtiqueta[g.modalidad] ?? g.modalidad}
                </td>
                <td className="px-4 py-3 font-mono-tab text-ink-soft">{g.cantidadCursos}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/grupos/${g.id}`}
                    className="text-xs font-medium text-brand-blue hover:underline"
                  >
                    Gestionar cursos
                  </Link>
                </td>
              </tr>
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
