"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, ne, notInArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { usuarios, asignaturas } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";

function revalidarDocentes() {
  revalidatePath("/roles");
  revalidatePath("/sedes");
  revalidatePath("/grupos", "layout");
}

// Deja a `docenteId` como docente predeterminado exactamente de
// `asignaturaIds` (todas de `sedeId`): marca esas y desmarca las demás que
// lo tenían. Si una asignatura ya tenía otro docente, pasa a este.
async function fijarAsignaturasDelDocente(
  docenteId: string,
  sedeId: string,
  asignaturaIds: string[]
) {
  const validas = asignaturaIds.length
    ? (
        await db
          .select({ id: asignaturas.id })
          .from(asignaturas)
          .where(and(inArray(asignaturas.id, asignaturaIds), eq(asignaturas.sedeId, sedeId)))
      ).map((a) => a.id)
    : [];

  await db.transaction(async (tx) => {
    await tx
      .update(asignaturas)
      .set({ docenteId: null })
      .where(
        validas.length
          ? and(eq(asignaturas.docenteId, docenteId), notInArray(asignaturas.id, validas))
          : eq(asignaturas.docenteId, docenteId)
      );
    if (validas.length) {
      await tx.update(asignaturas).set({ docenteId }).where(inArray(asignaturas.id, validas));
    }
  });
}

export async function crearUsuario(_prevState: string | null, formData: FormData) {
  const dni = String(formData.get("dni") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nombreCompleto = String(formData.get("nombre_completo") ?? "").trim();
  const rol = String(formData.get("rol") ?? "");
  const sedeId = String(formData.get("sede_id") ?? "") || null;
  const asignaturaIds = formData.getAll("asignatura_ids").map(String);

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

  let nuevoId: string;
  try {
    const passwordHash = await hashPassword(password);
    const [nuevo] = await db
      .insert(usuarios)
      .values({
        dni,
        passwordHash,
        nombreCompleto,
        rol,
        sedeId: rol === "docente" ? sedeId : null,
      })
      .returning({ id: usuarios.id });
    nuevoId = nuevo.id;
  } catch (err: unknown) {
    const mensaje = err instanceof Error ? err.message : "";
    return mensaje.includes("unique")
      ? "Ya existe un usuario con ese DNI."
      : "No se pudo crear el usuario.";
  }

  if (rol === "docente" && sedeId && asignaturaIds.length) {
    await fijarAsignaturasDelDocente(nuevoId, sedeId, asignaturaIds);
  }

  revalidarDocentes();
  return null;
}

export async function actualizarRol(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const rol = String(formData.get("rol") ?? "");
  if (!id || !["admin", "docente"].includes(rol)) return;

  // Solo entre admin y docente: las cuentas de estudiante no se tocan desde
  // aquí. Un admin no dicta: pierde su sede y deja de ser docente
  // predeterminado de cualquier asignatura.
  await db
    .update(usuarios)
    .set(rol === "admin" ? { rol, sedeId: null } : { rol })
    .where(and(eq(usuarios.id, id), inArray(usuarios.rol, ["admin", "docente"])));
  if (rol === "admin") {
    await db.update(asignaturas).set({ docenteId: null }).where(eq(asignaturas.docenteId, id));
  }
  revalidarDocentes();
}

export async function actualizarSedeDocente(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const sedeId = String(formData.get("sede_id") ?? "") || null;
  if (!id) return;

  await db
    .update(usuarios)
    .set({ sedeId })
    .where(and(eq(usuarios.id, id), eq(usuarios.rol, "docente")));
  // Al cambiar de sede deja de ser predeterminado de las asignaturas de la
  // otra sede (no puede dictarlas).
  if (sedeId) {
    await db
      .update(asignaturas)
      .set({ docenteId: null })
      .where(and(eq(asignaturas.docenteId, id), ne(asignaturas.sedeId, sedeId)));
  }
  revalidarDocentes();
}

export async function actualizarAsignaturasDocente(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const asignaturaIds = formData.getAll("asignatura_ids").map(String);
  if (!id) return;

  const [docente] = await db
    .select({ sedeId: usuarios.sedeId })
    .from(usuarios)
    .where(and(eq(usuarios.id, id), eq(usuarios.rol, "docente")))
    .limit(1);
  if (!docente?.sedeId) return;

  await fijarAsignaturasDelDocente(id, docente.sedeId, asignaturaIds);
  revalidarDocentes();
}
