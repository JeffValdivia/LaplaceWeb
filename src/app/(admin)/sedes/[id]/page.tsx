import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { sedes, grupos, cursos } from "@/lib/db/schema";
import { crearGrupo } from "../../grupos/actions";

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

export default async function SedeDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [sede] = await db.select().from(sedes).where(eq(sedes.id, id)).limit(1);
  if (!sede) notFound();

  const listaGrupos = await db
    .select({
      id: grupos.id,
      nombre: grupos.nombre,
      modalidad: grupos.modalidad,
      cantidadCursos: sql<number>`count(${cursos.id})`.mapWith(Number),
    })
    .from(grupos)
    .leftJoin(cursos, eq(cursos.grupoId, grupos.id))
    .where(eq(grupos.sedeId, id))
    .groupBy(grupos.id)
    .orderBy(asc(grupos.nombre));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/sedes" className="text-sm text-brand-blue hover:underline">
          ← Sedes y asignaturas
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-ink">{sede.nombre}</h1>
        {sede.descripcion && <p className="text-sm text-ink-soft">{sede.descripcion}</p>}
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-soft">
              <th className="px-4 py-3 font-medium">Grupo</th>
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
                <td colSpan={4} className="px-4 py-6 text-center text-ink-soft">
                  Esta sede todavía no tiene grupos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form
        action={crearGrupo}
        className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5 sm:flex-row sm:items-end sm:flex-wrap"
      >
        <input type="hidden" name="sede_id" value={id} />
        <label className="flex flex-1 flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Nombre del grupo</span>
          <input
            name="nombre"
            required
            placeholder="Grupo 1"
            className="rounded-md border border-line bg-bg px-3 py-2 outline-none focus:border-brand-blue"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Modalidad</span>
          <select
            name="modalidad"
            required
            defaultValue="presencial"
            className="rounded-md border border-line bg-bg px-3 py-2 outline-none focus:border-brand-blue"
          >
            <option value="presencial">Presencial</option>
            <option value="virtual">Virtual</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue"
        >
          Crear grupo en esta sede
        </button>
      </form>
    </div>
  );
}
