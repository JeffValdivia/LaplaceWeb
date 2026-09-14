"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { comunicados } from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";

export async function publicarComunicado(_prevState: string | null, formData: FormData) {
  const usuario = await obtenerUsuarioActual();
  const titulo = String(formData.get("titulo") ?? "").trim();
  const mensaje = String(formData.get("mensaje") ?? "").trim();
  const alcance = String(formData.get("alcance") ?? "");
  const grupoId = String(formData.get("grupo_id") ?? "") || null;

  if (!titulo || !mensaje) return "Completa el título y el mensaje.";
  if (!["academia", "grupo"].includes(alcance)) return "Elige a quién va dirigido.";
  if (alcance === "grupo" && !grupoId) return "Elige el grupo.";

  await db.insert(comunicados).values({
    titulo,
    mensaje,
    alcance,
    grupoId: alcance === "grupo" ? grupoId : null,
    publicadoPor: usuario?.id,
  });

  revalidatePath("/", "layout");
  return null;
}
