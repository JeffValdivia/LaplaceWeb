"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { recursos, cursos } from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { guardarArchivo, borrarArchivo } from "@/lib/storage";

export async function subirRecurso(_prevState: string | null, formData: FormData) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return "Tu sesión expiró, vuelve a iniciar sesión.";

  const cursoId = String(formData.get("curso_id") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;
  const enlaceUrl = String(formData.get("enlace_url") ?? "").trim() || null;
  const file = formData.get("archivo");

  if (!cursoId || !titulo) return "Completa el título y el curso.";
  if (!enlaceUrl && !(file instanceof File && file.size > 0)) {
    return "Sube un archivo o pega un enlace (para videos).";
  }
  if (file instanceof File && file.size > 20 * 1024 * 1024) {
    return "El archivo pesa más de 20 MB.";
  }

  if (usuario.rol === "docente") {
    const [curso] = await db
      .select({ id: cursos.id })
      .from(cursos)
      .where(and(eq(cursos.id, cursoId), eq(cursos.docenteId, usuario.id)))
      .limit(1);
    if (!curso) return "No dictas ese curso.";
  } else if (usuario.rol !== "admin") {
    return "No autorizado.";
  }

  let archivoPath: string | null = null;
  let tipoArchivo: string | null = null;
  let tamanoBytes: number | null = null;

  if (file instanceof File && file.size > 0) {
    archivoPath = await guardarArchivo(cursoId, file);
    tipoArchivo = file.type || null;
    tamanoBytes = file.size;
  }

  try {
    await db.insert(recursos).values({
      cursoId,
      titulo,
      descripcion,
      archivoPath,
      tipoArchivo,
      tamanoBytes,
      enlaceUrl,
      subidoPor: usuario.id,
    });
  } catch {
    if (archivoPath) await borrarArchivo(archivoPath);
    return "No se pudo registrar el recurso.";
  }

  revalidatePath("/", "layout");
  return null;
}

export async function eliminarRecurso(formData: FormData) {
  const usuario = await obtenerUsuarioActual();
  const id = String(formData.get("id") ?? "");
  if (!id || !usuario) return;

  const [fila] = await db
    .select({ archivoPath: recursos.archivoPath, docenteId: cursos.docenteId })
    .from(recursos)
    .innerJoin(cursos, eq(cursos.id, recursos.cursoId))
    .where(eq(recursos.id, id))
    .limit(1);
  if (!fila) return;
  if (usuario.rol === "docente" && fila.docenteId !== usuario.id) return;
  if (usuario.rol !== "admin" && usuario.rol !== "docente") return;

  if (fila.archivoPath) await borrarArchivo(fila.archivoPath);
  await db.delete(recursos).where(eq(recursos.id, id));
  revalidatePath("/", "layout");
}
