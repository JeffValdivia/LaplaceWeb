"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { usuarios, estudiantes, matriculas, grupos, sedes } from "@/lib/db/schema";
import { verifyPassword, hashPassword } from "./password";
import { crearSesion, cerrarSesion as borrarSesion } from "./session";
import { sumarUnMes } from "@/lib/vigencia";

const PROCESOS_POR_SEDE: Record<string, string[]> = {
  UCSM: ["ordinario", "extraordinario", "preca"],
  UNSA: ["ordinario", "extraordinario", "ceprequintos"],
};

export async function iniciarSesion(_prevState: string | null, formData: FormData) {
  const dni = String(formData.get("dni") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!dni || !password) return "Completa tu DNI y contraseña.";

  const usuario = await db.query.usuarios.findFirst({
    where: eq(usuarios.dni, dni),
  });

  if (!usuario || !(await verifyPassword(password, usuario.passwordHash))) {
    return "DNI o contraseña incorrectos.";
  }

  await crearSesion(usuario.id);

  if (usuario.rol === "docente") redirect("/docente");
  if (usuario.rol === "estudiante") redirect("/portal");
  redirect("/dashboard");
}

export async function registrarEstudiante(_prevState: string | null, formData: FormData) {
  const dni = String(formData.get("dni") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nombres = String(formData.get("nombres") ?? "").trim();
  const apellidos = String(formData.get("apellidos") ?? "").trim();
  const fechaNacimiento = String(formData.get("fecha_nacimiento") ?? "").trim();
  const celular = String(formData.get("celular") ?? "").trim();
  const correo = String(formData.get("correo") ?? "").trim();
  const apoderadoNombre = String(formData.get("apoderado_nombre") ?? "").trim();
  const apoderadoCelular = String(formData.get("apoderado_celular") ?? "").trim();
  const grupoId = String(formData.get("grupo_id") ?? "");
  const carreraId = String(formData.get("carrera_id") ?? "");
  const proceso = String(formData.get("proceso") ?? "");
  const tipoPostulacion = String(formData.get("tipo_postulacion") ?? "");

  if (
    !dni ||
    !password ||
    !nombres ||
    !apellidos ||
    !fechaNacimiento ||
    !celular ||
    !correo ||
    !apoderadoNombre ||
    !apoderadoCelular ||
    !grupoId ||
    !carreraId ||
    !proceso ||
    !tipoPostulacion
  ) {
    return "Completa todos los campos del formulario.";
  }
  if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";

  const [grupo] = await db
    .select({ id: grupos.id, sedeNombre: sedes.nombre })
    .from(grupos)
    .innerJoin(sedes, eq(sedes.id, grupos.sedeId))
    .where(eq(grupos.id, grupoId))
    .limit(1);

  if (!grupo || !PROCESOS_POR_SEDE[grupo.sedeNombre]?.includes(proceso)) {
    return "Elige una sede, grupo y proceso válidos.";
  }

  // Si el DNI ya fue matriculado antes por la academia, esta persona solo
  // necesita crear su cuenta de acceso (el flujo de siempre). Si no existe
  // todavía, se crea su ficha de estudiante y su matrícula de una vez.
  const existente = await db.query.estudiantes.findFirst({ where: eq(estudiantes.dni, dni) });

  let estudianteId: string;
  let nombreCompleto: string;

  if (existente) {
    const yaTieneCuenta = await db.query.usuarios.findFirst({
      where: eq(usuarios.estudianteId, existente.id),
    });
    if (yaTieneCuenta) return "Ese DNI ya tiene una cuenta creada.";

    estudianteId = existente.id;
    nombreCompleto = `${existente.nombres} ${existente.apellidos}`;
  } else {
    try {
      const hoy = new Date().toISOString().slice(0, 10);
      estudianteId = await db.transaction(async (tx) => {
        const [nuevo] = await tx
          .insert(estudiantes)
          .values({
            dni,
            nombres,
            apellidos,
            fechaNacimiento,
            telefono: celular,
            email: correo,
            apoderadoNombre,
            apoderadoTelefono: apoderadoCelular,
          })
          .returning({ id: estudiantes.id });

        await tx.insert(matriculas).values({
          estudianteId: nuevo.id,
          grupoId,
          carreraId,
          proceso,
          tipoPostulacion,
          fechaIngreso: hoy,
          fechaFin: sumarUnMes(hoy),
        });

        return nuevo.id;
      });
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : "";
      return mensaje.includes("unique")
        ? "Ese DNI ya está registrado."
        : "No se pudo completar tu inscripción.";
    }
    nombreCompleto = `${nombres} ${apellidos}`;
  }

  try {
    const passwordHash = await hashPassword(password);
    const [usuario] = await db
      .insert(usuarios)
      .values({ dni, passwordHash, nombreCompleto, rol: "estudiante", estudianteId })
      .returning({ id: usuarios.id });

    await crearSesion(usuario.id);
  } catch (err: unknown) {
    const mensaje = err instanceof Error ? err.message : "";
    return mensaje.includes("unique")
      ? "Ese DNI ya tiene una cuenta creada."
      : "No se pudo crear la cuenta.";
  }

  redirect("/portal");
}

export async function cerrarSesion() {
  await borrarSesion();
  redirect("/login");
}

