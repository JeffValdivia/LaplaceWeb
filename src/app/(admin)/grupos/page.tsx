import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { grupos, sedes, cursos, asignaturas, usuarios } from "@/lib/db/schema";
import { GrupoCard } from "./grupo-card";

export default async function GruposPage() {
  const [listaGrupos, filasCursos] = await Promise.all([
    db
      .select({
        id: grupos.id,
        nombre: grupos.nombre,
        modalidad: grupos.modalidad,
        sedeId: sedes.id,
        sedeNombre: sedes.nombre,
      })
      .from(grupos)
      .innerJoin(sedes, eq(sedes.id, grupos.sedeId))
      .orderBy(asc(sedes.nombre), asc(grupos.nombre)),
    db
      .select({
        grupoId: cursos.grupoId,
        asignaturaNombre: asignaturas.nombre,
        docenteNombre: usuarios.nombreCompleto,
      })
      .from(cursos)
      .innerJoin(asignaturas, eq(asignaturas.id, cursos.asignaturaId))
      .innerJoin(usuarios, eq(usuarios.id, cursos.docenteId)),
  ]);

  const cursosPorGrupo = new Map<string, { asignaturaNombre: string; docenteNombre: string }[]>();
  for (const fila of filasCursos) {
    if (!fila.grupoId) continue;
    const lista = cursosPorGrupo.get(fila.grupoId) ?? [];
    lista.push({ asignaturaNombre: fila.asignaturaNombre, docenteNombre: fila.docenteNombre });
    cursosPorGrupo.set(fila.grupoId, lista);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-ink">Grupos académicos</h1>
        <p className="text-sm text-ink-soft">
          Haz clic en un grupo para ver sus cursos. Para crear uno nuevo,
          entra a su sede desde{" "}
          <Link href="/sedes" className="underline">
            Asignaturas
          </Link>
          .
        </p>
      </div>

      {listaGrupos.length ? (
        [...new Map(listaGrupos.map((g) => [g.sedeId, g.sedeNombre])).entries()].map(
          ([sedeId, sedeNombre]) => (
            <section key={sedeId} className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">
                {sedeNombre}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {listaGrupos
                  .filter((g) => g.sedeId === sedeId)
                  .map((g) => (
                    <GrupoCard key={g.id} grupo={g} cursos={cursosPorGrupo.get(g.id) ?? []} />
                  ))}
              </div>
            </section>
          )
        )
      ) : (
        <p className="rounded-lg border border-line bg-surface px-4 py-6 text-center text-sm text-ink-soft">
          Todavía no hay grupos académicos. Entra a una sede para crear el primero.
        </p>
      )}
    </div>
  );
}
