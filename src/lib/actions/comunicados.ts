"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { comunicados, cursos } from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";

export async function publicarComunicado(_prevState: string | null, formData: FormData) {
  const usuario = await obtenerUsuarioActual();
  const titulo = String(formData.get("titulo") ?? "").trim();
  const mensaje = String(formData.get("mensaje") ?? "").trim();
  const alcance = String(formData.get("alcance") ?? "");
  const grupoId = String(formData.get("grupo_id") ?? "") || null;

  if (!usuario) return "Tu sesión expiró, vuelve a iniciar sesión.";
  if (!titulo || !mensaje) return "Completa el título y el mensaje.";
  if (!["academia", "grupo"].includes(alcance)) return "Elige a quién va dirigido.";
  if (alcance === "grupo" && !grupoId) return "Elige el grupo.";

  // Un docente solo publica en sus propios grupos, nunca a toda la
  // academia; el admin puede dirigirse a cualquiera.
  if (usuario.rol === "admin") {
    // sin restricciones adicionales
  } else if (usuario.rol === "docente") {
    if (alcance !== "grupo") return "No autorizado.";
    const [curso] = await db
      .select({ id: cursos.id })
      .from(cursos)
      .where(and(eq(cursos.grupoId, grupoId!), eq(cursos.docenteId, usuario.id)))
      .limit(1);
    if (!curso) return "No dictas en ese grupo.";
  } else {
    return "No autorizado.";
  }

  await db.insert(comunicados).values({
    titulo,
    mensaje,
    alcance,
    grupoId: alcance === "grupo" ? grupoId : null,
    publicadoPor: usuario.id,
  });

  revalidatePath("/", "layout");
  return null;
}
