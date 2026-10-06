import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cursos, grupos, sedes, asignaturas } from "@/lib/db/schema";

export type CursoNav = { cursoId: string; asignaturaNombre: string };

export type GrupoConCursos = {
  grupoId: string;
  grupoNombre: string;
  modalidad: string;
  sedeNombre: string;
  cursos: CursoNav[];
};

// Grupos y cursos del docente, para armar tanto el panel "Mis grupos y
// cursos" como el menú lateral — ambos muestran la misma jerarquía.
export async function obtenerMisGruposYCursos(docenteId: string) {
  const misCursos = await db
    .select({
      cursoId: cursos.id,
      asignaturaNombre: asignaturas.nombre,
      grupoId: grupos.id,
      grupoNombre: grupos.nombre,
      modalidad: grupos.modalidad,
      sedeNombre: sedes.nombre,
    })
    .from(cursos)
    .leftJoin(grupos, eq(grupos.id, cursos.grupoId))
    .leftJoin(sedes, eq(sedes.id, grupos.sedeId))
    .innerJoin(asignaturas, eq(asignaturas.id, cursos.asignaturaId))
    .where(eq(cursos.docenteId, docenteId))
    .orderBy(asc(grupos.nombre), asc(asignaturas.nombre));

  const gruposMap = new Map<string, GrupoConCursos>();
  const cursosSinGrupo: CursoNav[] = [];
  for (const c of misCursos) {
    if (!c.grupoId) {
      cursosSinGrupo.push({ cursoId: c.cursoId, asignaturaNombre: c.asignaturaNombre });
      continue;
    }
    const grupo = gruposMap.get(c.grupoId) ?? {
      grupoId: c.grupoId,
      grupoNombre: c.grupoNombre ?? "",
      modalidad: c.modalidad ?? "",
      sedeNombre: c.sedeNombre ?? "",
      cursos: [],
    };
    grupo.cursos.push({ cursoId: c.cursoId, asignaturaNombre: c.asignaturaNombre });
    gruposMap.set(c.grupoId, grupo);
  }

  return { grupos: [...gruposMap.values()], cursosSinGrupo };
}
