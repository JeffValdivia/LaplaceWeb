"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { estudiantes, matriculas } from "@/lib/db/schema";
import { sumarUnMes } from "@/lib/vigencia";

export async function matricularEstudiante(_prevState: string | null, formData: FormData) {
  const dni = String(formData.get("dni") ?? "").trim();
  const nombres = String(formData.get("nombres") ?? "").trim();
  const apellidos = String(formData.get("apellidos") ?? "").trim();
  const telefono = String(formData.get("telefono") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const apoderadoNombre = String(formData.get("apoderado_nombre") ?? "").trim() || null;
  const apoderadoTelefono = String(formData.get("apoderado_telefono") ?? "").trim() || null;
  const grupoId = String(formData.get("grupo_id") ?? "");
  const fechaIngreso = String(formData.get("fecha_ingreso") ?? "");

  if (!dni || !nombres || !apellidos || !grupoId || !fechaIngreso) {
    return "Completa DNI, nombres, apellidos, grupo y fecha de ingreso.";
  }

  let estudianteId: string;
  try {
    const [estudiante] = await db
      .insert(estudiantes)
      .values({
        dni,
        nombres,
        apellidos,
        telefono,
        email,
        apoderadoNombre,
        apoderadoTelefono,
      })
      .returning({ id: estudiantes.id });
    estudianteId = estudiante.id;
  } catch (err: unknown) {
    const mensaje = err instanceof Error ? err.message : "";
    if (mensaje.includes("unique")) {
      return "Ya existe un estudiante registrado con ese DNI.";
    }
    return "No se pudo registrar al estudiante.";
  }

  try {
    await db.insert(matriculas).values({
      estudianteId,
      grupoId,
      fechaIngreso,
      fechaFin: sumarUnMes(fechaIngreso),
    });
  } catch {
    return "El estudiante se guardó, pero la matrícula falló. Reintenta desde su ficha.";
  }

  revalidatePath("/estudiantes");
  redirect("/estudiantes");
}
