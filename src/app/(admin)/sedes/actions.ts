"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { asignaturas, cursos } from "@/lib/db/schema";
import { docenteValidoParaSede } from "@/lib/docentes";

function revalidarAsignaturas() {
  revalidatePath("/sedes");
  revalidatePath("/grupos", "layout");
}

export async function crearAsignatura(_prevState: string | null, formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const sedeId = String(formData.get("sede_id") ?? "");
  const docenteId = String(formData.get("docente_id") ?? "") || null;
  if (!nombre || !sedeId) return "Completa el nombre y la sede.";
  if (docenteId && !(await docenteValidoParaSede(docenteId, sedeId))) {
    return "Ese docente no dicta en la sede elegida.";
  }

  try {
    await db.insert(asignaturas).values({ nombre, sedeId, docenteId });
  } catch (err: unknown) {
    const mensaje = err instanceof Error ? err.message : "";
    return mensaje.includes("unique")
      ? "Esa asignatura ya existe en esta sede."
      : "No se pudo crear la asignatura.";
  }

  revalidarAsignaturas();
  return null;
}

// Cambia el docente que se propone para cursos nuevos. Los cursos ya
// creados conservan su docente (para eso está aplicarDocenteACursos).
export async function actualizarDocenteAsignatura(formData: FormData) {
  const asignaturaId = String(formData.get("asignatura_id") ?? "");
  const docenteId = String(formData.get("docente_id") ?? "") || null;
  if (!asignaturaId) return;

  const [asignatura] = await db
    .select({ sedeId: asignaturas.sedeId })
    .from(asignaturas)
    .where(eq(asignaturas.id, asignaturaId))
    .limit(1);
  if (!asignatura) return;
  if (docenteId && !(await docenteValidoParaSede(docenteId, asignatura.sedeId))) return;

  await db.update(asignaturas).set({ docenteId }).where(eq(asignaturas.id, asignaturaId));
  revalidarAsignaturas();
}

export async function aplicarDocenteACursos(formData: FormData) {
  const asignaturaId = String(formData.get("asignatura_id") ?? "");
  if (!asignaturaId) return;

  const [asignatura] = await db
    .select({ docenteId: asignaturas.docenteId })
    .from(asignaturas)
    .where(eq(asignaturas.id, asignaturaId))
    .limit(1);
  if (!asignatura?.docenteId) return;

  await db
    .update(cursos)
    .set({ docenteId: asignatura.docenteId })
    .where(eq(cursos.asignaturaId, asignaturaId));
  revalidarAsignaturas();
}
