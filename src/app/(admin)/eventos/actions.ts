"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { eventos } from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";

export async function crearEvento(_prevState: string | null, formData: FormData) {
  const usuario = await obtenerUsuarioActual();
  const titulo = String(formData.get("titulo") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;
  const fecha = String(formData.get("fecha") ?? "");
  const tipo = String(formData.get("tipo") ?? "");
  const alcance = String(formData.get("alcance") ?? "");
  const sedeId = String(formData.get("sede_id") ?? "") || null;
  const grupoId = String(formData.get("grupo_id") ?? "") || null;

  if (!titulo || !fecha) return "Completa el título y la fecha.";
  if (!["academico", "examen", "entrega"].includes(tipo)) return "Elige un tipo de evento válido.";
  if (!["academia", "sede", "grupo"].includes(alcance)) return "Elige a quién va dirigido.";
  if (alcance === "sede" && !sedeId) return "Elige la sede.";
  if (alcance === "grupo" && !grupoId) return "Elige el grupo.";

  await db.insert(eventos).values({
    titulo,
    descripcion,
    fecha,
    tipo,
    alcance,
    sedeId: alcance === "sede" ? sedeId : null,
    grupoId: alcance === "grupo" ? grupoId : null,
    creadoPor: usuario?.id,
  });

  revalidatePath("/eventos");
  revalidatePath("/", "layout");
  return null;
}

export async function eliminarEvento(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.delete(eventos).where(eq(eventos.id, id));
  revalidatePath("/eventos");
  revalidatePath("/", "layout");
}
