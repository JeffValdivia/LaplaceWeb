"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { usuarios } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";

export async function crearUsuario(_prevState: string | null, formData: FormData) {
  const dni = String(formData.get("dni") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nombreCompleto = String(formData.get("nombre_completo") ?? "").trim();
  const rol = String(formData.get("rol") ?? "");
  const sedeId = String(formData.get("sede_id") ?? "") || null;

  if (!dni || !password || !nombreCompleto) {
    return "Completa DNI, contraseña y nombre.";
  }
  if (password.length < 6) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  if (!["admin", "docente"].includes(rol)) {
    return "Elige un rol.";
  }
  if (rol === "docente" && !sedeId) {
    return "Elige la sede donde dicta el docente.";
  }

  try {
    const passwordHash = await hashPassword(password);
    await db.insert(usuarios).values({
      dni,
      passwordHash,
      nombreCompleto,
      rol,
      sedeId: rol === "docente" ? sedeId : null,
    });
  } catch (err: unknown) {
    const mensaje = err instanceof Error ? err.message : "";
    return mensaje.includes("unique")
      ? "Ya existe un usuario con ese DNI."
      : "No se pudo crear el usuario.";
  }

  revalidatePath("/roles");
  return null;
}

export async function actualizarRol(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const rol = String(formData.get("rol") ?? "");
  if (!id || !["admin", "docente"].includes(rol)) return;

  // Solo entre admin y docente: las cuentas de estudiante no se tocan desde
  // aquí. Un admin no dicta, así que pierde la sede si la tenía.
  await db
    .update(usuarios)
    .set(rol === "admin" ? { rol, sedeId: null } : { rol })
    .where(and(eq(usuarios.id, id), inArray(usuarios.rol, ["admin", "docente"])));
  revalidatePath("/roles");
}

export async function actualizarSedeDocente(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const sedeId = String(formData.get("sede_id") ?? "") || null;
  if (!id) return;

  await db
    .update(usuarios)
    .set({ sedeId })
    .where(and(eq(usuarios.id, id), eq(usuarios.rol, "docente")));
  revalidatePath("/roles");
  revalidatePath("/sedes");
  revalidatePath("/grupos", "layout");
}
