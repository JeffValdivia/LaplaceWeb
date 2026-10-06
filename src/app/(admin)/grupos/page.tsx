import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { grupos, sedes, cursos, asignaturas, usuarios } from "@/lib/db/schema";
import { SeccionesSede } from "./secciones-sede";

export default async function GruposPage() {
  const [listaSedes, listaGrupos, filasCursos] = await Promise.all([
    db.select({ id: sedes.id, nombre: sedes.nombre }).from(sedes).orderBy(asc(sedes.nombre)),
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

  const cursosPorGrupo: Record<string, { asignaturaNombre: string; docenteNombre: string }[]> = {};
  for (const fila of filasCursos) {
    if (!fila.grupoId) continue;
    const lista = cursosPorGrupo[fila.grupoId] ?? [];
    lista.push({ asignaturaNombre: fila.asignaturaNombre, docenteNombre: fila.docenteNombre });
    cursosPorGrupo[fila.grupoId] = lista;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Grupos académicos</h1>
        <p className="text-sm text-ink-soft">
          Elige una sede para ver sus grupos, y haz clic en un grupo para ver sus cursos. Para
          crear uno nuevo, entra a su sede desde{" "}
          <Link href="/sedes" className="underline">
            Asignaturas
          </Link>
          .
        </p>
      </div>

      {listaSedes.length ? (
        <SeccionesSede sedes={listaSedes} grupos={listaGrupos} cursosPorGrupo={cursosPorGrupo} />
      ) : (
        <p className="surface-card px-4 py-6 text-center text-sm text-ink-soft">
          Todavía no hay sedes registradas.
        </p>
      )}
    </div>
  );
}
