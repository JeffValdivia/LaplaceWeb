"use server";

import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matriculas, estudiantes, usuarios } from "@/lib/db/schema";
import { sumarUnMes, sumarUnDia } from "@/lib/vigencia";
import { hashPassword } from "@/lib/auth/password";

export async function marcarRetirada(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.update(matriculas).set({ retirada: true }).where(eq(matriculas.id, id));
  revalidatePath("/vigencia");
  revalidatePath("/estudiantes");
  revalidatePath("/dashboard");
}

// Renueva la mensualidad del estudiante.
// - Si renueva mientras todavía está vigente (activa o por vencer), el
//   nuevo periodo continúa desde el día siguiente al que terminaba su
//   última matrícula, para no quitarle días ya pagados.
// - Si renueva después de vencida, el nuevo periodo empieza hoy (el día
//   que vuelve a activarse), no desde esa fecha vieja: no tendría sentido
//   seguir contando desde un vencimiento que ya pasó hace tiempo.
export async function renovarMatricula(formData: FormData) {
  const estudianteId = String(formData.get("estudiante_id") ?? "");
  if (!estudianteId) return;

  const [ultima] = await db
    .select({ grupoId: matriculas.grupoId, fechaFin: matriculas.fechaFin })
    .from(matriculas)
    .where(eq(matriculas.estudianteId, estudianteId))
    .orderBy(desc(matriculas.fechaIngreso))
    .limit(1);
  if (!ultima) return;

  const hoy = new Date().toISOString().slice(0, 10);
  const fechaIngreso = ultima.fechaFin < hoy ? hoy : sumarUnDia(ultima.fechaFin);
  const fechaFin = sumarUnMes(fechaIngreso);

  await db.insert(matriculas).values({
    estudianteId,
    grupoId: ultima.grupoId,
    fechaIngreso,
    fechaFin,
    retirada: false,
  });

  revalidatePath("/vigencia");
  revalidatePath("/estudiantes");
  revalidatePath("/dashboard");
  revalidatePath("/reportes");
}

export async function actualizarEstudiante(_prevState: string | null, formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const dni = String(formData.get("dni") ?? "").trim();
  const nombres = String(formData.get("nombres") ?? "").trim();
  const apellidos = String(formData.get("apellidos") ?? "").trim();
  const fechaNacimiento = String(formData.get("fecha_nacimiento") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const apoderadoNombre = String(formData.get("apoderado_nombre") ?? "").trim();
  const apoderadoTelefono = String(formData.get("apoderado_telefono") ?? "").trim();

  if (!id || !dni || !nombres || !apellidos) {
    return "Completa al menos DNI, nombres y apellidos.";
  }

  try {
    await db
      .update(estudiantes)
      .set({
        dni,
        nombres,
        apellidos,
        fechaNacimiento: fechaNacimiento || null,
        telefono: telefono || null,
        email: email || null,
        apoderadoNombre: apoderadoNombre || null,
        apoderadoTelefono: apoderadoTelefono || null,
      })
      .where(eq(estudiantes.id, id));
  } catch (err: unknown) {
    const mensaje = err instanceof Error ? err.message : "";
    if (mensaje.includes("unique")) {
      return "Ya existe otro estudiante registrado con ese DNI.";
    }
    return "No se pudo actualizar al estudiante.";
  }

  revalidatePath("/vigencia");
  revalidatePath("/estudiantes");
  return null;
}

// Restablece el acceso del alumno: la contraseña vuelve a ser su DNI y
// queda marcada para que la cambie en su próximo ingreso. Si todavía no
// tenía cuenta de acceso (matriculado directamente por el staff, sin pasar
// por autoregistro ni carga Excel), se le crea una aquí mismo.
export type ResultadoReset = { ok: boolean; mensaje: string } | null;

export async function restablecerPasswordEstudiante(
  _prevState: ResultadoReset,
  formData: FormData
): Promise<ResultadoReset> {
  const estudianteId = String(formData.get("estudiante_id") ?? "");
  if (!estudianteId) return { ok: false, mensaje: "Falta el estudiante." };

  const [estudiante] = await db
    .select({ dni: estudiantes.dni, nombres: estudiantes.nombres, apellidos: estudiantes.apellidos })
    .from(estudiantes)
    .where(eq(estudiantes.id, estudianteId))
    .limit(1);
  if (!estudiante) return { ok: false, mensaje: "Ese estudiante ya no existe." };

  const passwordHash = await hashPassword(estudiante.dni);

  const [cuenta] = await db
    .select({ id: usuarios.id })
    .from(usuarios)
    .where(eq(usuarios.estudianteId, estudianteId))
    .limit(1);

  try {
    if (cuenta) {
      await db
        .update(usuarios)
        .set({ passwordHash, debeCambiarPassword: true, dni: estudiante.dni })
        .where(eq(usuarios.id, cuenta.id));
    } else {
      await db.insert(usuarios).values({
        dni: estudiante.dni,
        passwordHash,
        nombreCompleto: `${estudiante.nombres} ${estudiante.apellidos}`,
        rol: "estudiante",
        estudianteId,
        debeCambiarPassword: true,
      });
    }
  } catch (err: unknown) {
    const mensaje = err instanceof Error ? err.message : "";
    if (mensaje.includes("unique")) {
      return { ok: false, mensaje: "Ya existe una cuenta de acceso con ese DNI usada por otro usuario." };
    }
    return { ok: false, mensaje: "No se pudo restablecer la contraseña." };
  }

  return { ok: true, mensaje: `Listo. Contraseña restablecida a ${estudiante.dni}.` };
}
