"use server";

import { redirect } from "next/navigation";
import { eq, and, notExists } from "drizzle-orm";
import { db } from "@/lib/db";
import { usuarios, estudiantes } from "@/lib/db/schema";
import { verifyPassword, hashPassword } from "./password";
import { crearSesion, cerrarSesion as borrarSesion } from "./session";

export async function iniciarSesion(_prevState: string | null, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return "Completa tu correo y contraseña.";

  const usuario = await db.query.usuarios.findFirst({
    where: eq(usuarios.email, email),
  });

  if (!usuario || !(await verifyPassword(password, usuario.passwordHash))) {
    return "Correo o contraseña incorrectos.";
  }

  await crearSesion(usuario.id);

  if (usuario.rol === "docente") redirect("/docente");
  if (usuario.rol === "estudiante") redirect("/portal");
  redirect("/dashboard");
}

export async function registrarEstudiante(_prevState: string | null, formData: FormData) {
  const dni = String(formData.get("dni") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!dni || !email || !password) return "Completa tu DNI, correo y contraseña.";
  if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";

  // Busca un estudiante con ese DNI que todavía no tenga cuenta.
  const [encontrado] = await db
    .select({ id: estudiantes.id, nombres: estudiantes.nombres, apellidos: estudiantes.apellidos })
    .from(estudiantes)
    .where(
      and(
        eq(estudiantes.dni, dni),
        notExists(
          db.select().from(usuarios).where(eq(usuarios.estudianteId, estudiantes.id))
        )
      )
    )
    .limit(1);

  if (!encontrado) {
    return "No encontramos ese DNI matriculado, o esa cuenta ya fue creada. Consulta con la academia.";
  }

  try {
    const passwordHash = await hashPassword(password);
    const [usuario] = await db
      .insert(usuarios)
      .values({
        email,
        passwordHash,
        nombreCompleto: `${encontrado.nombres} ${encontrado.apellidos}`,
        rol: "estudiante",
        estudianteId: encontrado.id,
      })
      .returning({ id: usuarios.id });

    await crearSesion(usuario.id);
  } catch (err: unknown) {
    const mensaje = err instanceof Error ? err.message : "";
    return mensaje.includes("unique")
      ? "Ese correo ya tiene una cuenta, o ese DNI ya fue registrado."
      : "No se pudo crear la cuenta.";
  }

  redirect("/portal");
}

export async function cerrarSesion() {
  await borrarSesion();
  redirect("/login");
}
