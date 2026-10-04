import "server-only";
import { and, asc, eq, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { usuarios, sedes } from "@/lib/db/schema";

// Docentes que pueden dictar en una sede: los asignados a ella y los que
// todavía no tienen sede (para no dejar fuera a los creados antes de que
// existiera el campo). Si no se pasa sede, devuelve todos los docentes.
export async function listarDocentes(sedeId?: string) {
  return db
    .select({
      id: usuarios.id,
      nombreCompleto: usuarios.nombreCompleto,
      sedeId: usuarios.sedeId,
      sedeNombre: sedes.nombre,
    })
    .from(usuarios)
    .leftJoin(sedes, eq(sedes.id, usuarios.sedeId))
    .where(
      sedeId
        ? and(eq(usuarios.rol, "docente"), or(eq(usuarios.sedeId, sedeId), isNull(usuarios.sedeId)))
        : eq(usuarios.rol, "docente")
    )
    .orderBy(asc(usuarios.nombreCompleto));
}

// Valida en el servidor que el usuario sea docente y pueda dictar en la sede.
export async function docenteValidoParaSede(docenteId: string, sedeId: string) {
  const [d] = await db
    .select({ id: usuarios.id })
    .from(usuarios)
    .where(
      and(
        eq(usuarios.id, docenteId),
        eq(usuarios.rol, "docente"),
        or(eq(usuarios.sedeId, sedeId), isNull(usuarios.sedeId))
      )
    )
    .limit(1);
  return !!d;
}
