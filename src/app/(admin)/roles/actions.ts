"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { usuarios } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";

export async function crearUsuario(_prevState: string | null, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nombreCompleto = String(formData.get("nombre_completo") ?? "").trim();
  const rol = String(formData.get("rol") ?? "");

  if (!email || !password || !nombreCompleto) {
    return "Completa correo, contraseña y nombre.";
  }
  if (password.length < 6) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  if (!["admin", "docente", "estudiante"].includes(rol)) {
    return "Elige un rol.";
  }

  try {
    const passwordHash = await hashPassword(password);
    await db.insert(usuarios).values({ email, passwordHash, nombreCompleto, rol });
  } catch (err: unknown) {
    const mensaje = err instanceof Error ? err.message : "";
    return mensaje.includes("unique")
      ? "Ya existe un usuario con ese correo."
      : "No se pudo crear el usuario.";
  }

  revalidatePath("/roles");
  return null;
}

export async function actualizarRol(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const rol = String(formData.get("rol") ?? "");
  if (!id || !["admin", "docente", "estudiante"].includes(rol)) return;

  await db.update(usuarios).set({ rol }).where(eq(usuarios.id, id));
  revalidatePath("/roles");
}
