"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { grupos, cursos, asignaturas } from "@/lib/db/schema";
import { docenteValidoParaSede } from "@/lib/docentes";

// Rutas que leen `grupos` (directamente o filtrando por `activo`) y por eso
// necesitan invalidarse cuando un grupo se edita, elimina o retira.
function revalidarVistasDeGrupos(sedeId: string) {
  revalidatePath("/grupos");
  revalidatePath(`/sedes/${sedeId}`);
  revalidatePath("/estudiantes/nuevo");
  revalidatePath("/dashboard");
  revalidatePath("/campus");
  revalidatePath("/evaluaciones");
  revalidatePath("/asistencia");
  revalidatePath("/notificaciones");
}

export async function crearGrupo(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const sedeId = String(formData.get("sede_id") ?? "");
  const modalidad = String(formData.get("modalidad") ?? "");
  if (!nombre || !sedeId) return;
  if (!["presencial", "virtual"].includes(modalidad)) return;

  await db.insert(grupos).values({
    nombre,
    sedeId,
    modalidad,
  });
  revalidarVistasDeGrupos(sedeId);
}

export async function actualizarGrupo(formData: FormData) {
  const grupoId = String(formData.get("grupo_id") ?? "");
  const sedeId = String(formData.get("sede_id") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const modalidad = String(formData.get("modalidad") ?? "");
  if (!grupoId || !sedeId || !nombre) return;
  if (!["presencial", "virtual"].includes(modalidad)) return;

  await db.update(grupos).set({ nombre, modalidad }).where(eq(grupos.id, grupoId));
  revalidarVistasDeGrupos(sedeId);
}

// Borra el grupo. Sus cursos y las matrículas de sus estudiantes no se
// tocan: por el ON DELETE SET NULL del esquema, quedan sin grupo (se ven
// como "Sin grupo" donde antes se mostraba su nombre) en vez de borrarse.
export async function eliminarGrupo(formData: FormData) {
  const grupoId = String(formData.get("grupo_id") ?? "");
  const sedeId = String(formData.get("sede_id") ?? "");
  if (!grupoId || !sedeId) return;

  await db.delete(grupos).where(eq(grupos.id, grupoId));
  revalidarVistasDeGrupos(sedeId);
}

async function sedeDelGrupo(grupoId: string) {
  const [g] = await db
    .select({ sedeId: grupos.sedeId })
    .from(grupos)
    .where(eq(grupos.id, grupoId))
    .limit(1);
  return g?.sedeId ?? null;
}

export async function agregarCurso(formData: FormData) {
  const grupoId = String(formData.get("grupo_id") ?? "");
  const asignaturaId = String(formData.get("asignatura_id") ?? "");
  const docenteId = String(formData.get("docente_id") ?? "");
  if (!grupoId || !asignaturaId || !docenteId) return;

  const sedeId = await sedeDelGrupo(grupoId);
  if (!sedeId) return;
  const [asignatura] = await db
    .select({ id: asignaturas.id })
    .from(asignaturas)
    .where(and(eq(asignaturas.id, asignaturaId), eq(asignaturas.sedeId, sedeId)))
    .limit(1);
  if (!asignatura || !(await docenteValidoParaSede(docenteId, sedeId))) return;

  await db.insert(cursos).values({ grupoId, asignaturaId, docenteId });
  revalidatePath(`/grupos/${grupoId}`);
  revalidatePath("/grupos");
  revalidatePath("/sedes");
}

export async function actualizarDocenteCurso(formData: FormData) {
  const cursoId = String(formData.get("curso_id") ?? "");
  const grupoId = String(formData.get("grupo_id") ?? "");
  const docenteId = String(formData.get("docente_id") ?? "");
  if (!cursoId || !grupoId || !docenteId) return;

  const sedeId = await sedeDelGrupo(grupoId);
  if (!sedeId || !(await docenteValidoParaSede(docenteId, sedeId))) return;

  await db.update(cursos).set({ docenteId }).where(eq(cursos.id, cursoId));
  revalidatePath(`/grupos/${grupoId}`);
  revalidatePath("/grupos");
  revalidatePath("/sedes");
}

export async function quitarCurso(formData: FormData) {
  const cursoId = String(formData.get("curso_id") ?? "");
  const grupoId = String(formData.get("grupo_id") ?? "");
  if (!cursoId || !grupoId) return;

  await db.delete(cursos).where(eq(cursos.id, cursoId));
  revalidatePath(`/grupos/${grupoId}`);
}
