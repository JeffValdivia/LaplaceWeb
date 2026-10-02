"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { carreras, estudiantes, matriculas, grupos, sedes, usuarios } from "@/lib/db/schema";
import { sumarUnMes } from "@/lib/vigencia";
import { hashPassword } from "@/lib/auth/password";
import {
  PROCESOS_POR_SEDE as PROCESOS_POR_SEDE_LABELS,
  TIPOS_POSTULACION,
  leerFilasExcel,
  type FilaImportada,
} from "@/lib/estudiantes-excel";

const PROCESOS_POR_SEDE: Record<string, string[]> = {
  UCSM: ["ordinario", "extraordinario", "preca"],
  UNSA: ["ordinario", "extraordinario", "ceprequintos"],
};

export async function matricularEstudiante(_prevState: string | null, formData: FormData) {
  const dni = String(formData.get("dni") ?? "").trim();
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
  const fechaIngreso = String(formData.get("fecha_ingreso") ?? "");

  if (
    !dni ||
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
    !tipoPostulacion ||
    !fechaIngreso
  ) {
    return "Completa todos los campos del formulario.";
  }

  const [grupo] = await db
    .select({ id: grupos.id, sedeNombre: sedes.nombre })
    .from(grupos)
    .innerJoin(sedes, eq(sedes.id, grupos.sedeId))
    .where(eq(grupos.id, grupoId))
    .limit(1);

  if (!grupo || !PROCESOS_POR_SEDE[grupo.sedeNombre]?.includes(proceso)) {
    return "Elige una sede, grupo y proceso válidos.";
  }

  let estudianteId: string;
  try {
    const [estudiante] = await db
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
      carreraId,
      proceso,
      tipoPostulacion,
      fechaIngreso,
      fechaFin: sumarUnMes(fechaIngreso),
    });
  } catch {
    return "El estudiante se guardó, pero la matrícula falló. Reintenta desde su ficha.";
  }

  revalidatePath("/estudiantes");
  redirect("/estudiantes");
}

export type FilaErrorImportacion = { fila: number; mensaje: string };
export type ResultadoImportacion = { creados: number; errores: FilaErrorImportacion[] } | null;

const normalizar = (s: string) => s.trim().toLowerCase();

// Carga masiva desde el Excel generado por /api/estudiantes/plantilla.
// Cada fila se procesa en su propia transacción: si una fila falla, las
// demás se siguen procesando (no se cancela todo el archivo por un error).
// Además de matricular, crea la cuenta de acceso del alumno con contraseña
// provisional = su DNI (debe cambiarla en su primer ingreso).
export async function importarEstudiantesExcel(
  _prevState: ResultadoImportacion,
  formData: FormData
): Promise<ResultadoImportacion> {
  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { creados: 0, errores: [{ fila: 0, mensaje: "Selecciona un archivo Excel (.xlsx)." }] };
  }

  let filas: FilaImportada[];
  try {
    filas = await leerFilasExcel(await archivo.arrayBuffer());
  } catch {
    return {
      creados: 0,
      errores: [{ fila: 0, mensaje: "No se pudo leer el archivo. ¿Es un Excel (.xlsx) válido?" }],
    };
  }

  if (!filas.length) {
    return { creados: 0, errores: [{ fila: 0, mensaje: "El archivo no tiene filas con datos." }] };
  }

  const [listaSedes, listaGrupos, listaCarreras] = await Promise.all([
    db.select().from(sedes),
    db
      .select({ id: grupos.id, nombre: grupos.nombre, sedeId: grupos.sedeId })
      .from(grupos)
      .where(eq(grupos.activo, true)),
    db
      .select({ id: carreras.id, nombre: carreras.nombre })
      .from(carreras)
      .where(eq(carreras.activo, true)),
  ]);

  const sedePorNombre = new Map(listaSedes.map((s) => [normalizar(s.nombre), s]));
  const carreraPorNombre = new Map(listaCarreras.map((c) => [normalizar(c.nombre), c.id]));

  const hoy = new Date().toISOString().slice(0, 10);
  const errores: FilaErrorImportacion[] = [];
  let creados = 0;

  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i];
    const numeroFila = i + 2; // la fila 1 del Excel es el encabezado

    const faltantes: string[] = [];
    if (!fila.apellidos) faltantes.push("Apellidos");
    if (!fila.nombres) faltantes.push("Nombres");
    if (!fila.dni) faltantes.push("DNI");
    if (!fila.fechaNacimiento) faltantes.push("Fecha de nacimiento");
    if (!fila.celular) faltantes.push("Celular");
    if (!fila.correo) faltantes.push("Correo electrónico");
    if (!fila.apoderadoNombre) faltantes.push("Nombres del apoderado");
    if (!fila.apoderadoCelular) faltantes.push("Celular del apoderado");
    if (!fila.sede) faltantes.push("Sede");
    if (!fila.grupo) faltantes.push("Grupo");
    if (!fila.carrera) faltantes.push("Carrera");
    if (!fila.proceso) faltantes.push("Proceso");
    if (!fila.tipoPostulacion) faltantes.push("Tipo de postulación");

    if (faltantes.length) {
      errores.push({ fila: numeroFila, mensaje: `Faltan datos: ${faltantes.join(", ")}.` });
      continue;
    }

    const sede = sedePorNombre.get(normalizar(fila.sede));
    if (!sede) {
      errores.push({ fila: numeroFila, mensaje: `Sede "${fila.sede}" no existe (usa UCSM o UNSA).` });
      continue;
    }

    const grupo = listaGrupos.find(
      (g) => g.sedeId === sede.id && normalizar(g.nombre) === normalizar(fila.grupo)
    );
    if (!grupo) {
      errores.push({
        fila: numeroFila,
        mensaje: `Grupo "${fila.grupo}" no existe en la sede ${sede.nombre}.`,
      });
      continue;
    }

    const carreraId = carreraPorNombre.get(normalizar(fila.carrera));
    if (!carreraId) {
      errores.push({ fila: numeroFila, mensaje: `Carrera "${fila.carrera}" no existe.` });
      continue;
    }

    const opcionesProceso = PROCESOS_POR_SEDE_LABELS[sede.nombre] ?? [];
    const proceso = opcionesProceso.find(
      (p) => normalizar(p.value) === normalizar(fila.proceso) || normalizar(p.label) === normalizar(fila.proceso)
    )?.value;
    if (!proceso) {
      errores.push({
        fila: numeroFila,
        mensaje: `Proceso "${fila.proceso}" no es válido para ${sede.nombre} (usa ${opcionesProceso
          .map((p) => p.label)
          .join(", ")}).`,
      });
      continue;
    }

    const tipoPostulacion = TIPOS_POSTULACION.find(
      (t) =>
        normalizar(t.value) === normalizar(fila.tipoPostulacion) ||
        normalizar(t.label) === normalizar(fila.tipoPostulacion)
    )?.value;
    if (!tipoPostulacion) {
      errores.push({
        fila: numeroFila,
        mensaje: `Tipo de postulación "${fila.tipoPostulacion}" no es válido (usa Egresado o Estudiante).`,
      });
      continue;
    }

    const fechaIngreso = fila.fechaIngreso || hoy;

    try {
      await db.transaction(async (tx) => {
        const [estudiante] = await tx
          .insert(estudiantes)
          .values({
            dni: fila.dni,
            nombres: fila.nombres,
            apellidos: fila.apellidos,
            fechaNacimiento: fila.fechaNacimiento,
            telefono: fila.celular,
            email: fila.correo,
            apoderadoNombre: fila.apoderadoNombre,
            apoderadoTelefono: fila.apoderadoCelular,
          })
          .returning({ id: estudiantes.id });

        await tx.insert(matriculas).values({
          estudianteId: estudiante.id,
          grupoId: grupo.id,
          carreraId,
          proceso,
          tipoPostulacion,
          fechaIngreso,
          fechaFin: sumarUnMes(fechaIngreso),
        });

        const passwordHash = await hashPassword(fila.dni);
        await tx.insert(usuarios).values({
          dni: fila.dni,
          passwordHash,
          nombreCompleto: `${fila.nombres} ${fila.apellidos}`,
          rol: "estudiante",
          estudianteId: estudiante.id,
          debeCambiarPassword: true,
        });
      });
      creados++;
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : "";
      errores.push({
        fila: numeroFila,
        mensaje: mensaje.includes("unique")
          ? `Ya existe un estudiante o una cuenta con DNI ${fila.dni}.`
          : `No se pudo guardar la fila (DNI ${fila.dni}).`,
      });
    }
  }

  if (creados > 0) revalidatePath("/estudiantes");
  return { creados, errores };
}
