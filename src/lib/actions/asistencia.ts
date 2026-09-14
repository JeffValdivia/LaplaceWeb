"use server";

import { revalidatePath } from "next/cache";
import { sql, eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { asistencias, cursos } from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";

const ESTADOS = ["presente", "tardanza", "falta", "justificado"] as const;

export async function guardarAsistencia(formData: FormData) {
  const usuario = await obtenerUsuarioActual();
  const cursoId = String(formData.get("curso_id") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const modalidad = String(formData.get("modalidad") ?? "");
  if (!cursoId || !fecha || !["presencial", "virtual"].includes(modalidad) || !usuario) return;

  if (usuario.rol === "docente") {
    const [curso] = await db
      .select({ id: cursos.id })
      .from(cursos)
      .where(and(eq(cursos.id, cursoId), eq(cursos.docenteId, usuario.id)))
      .limit(1);
    if (!curso) return;
  } else if (usuario.rol !== "admin") {
    return;
  }

  const filas: {
    cursoId: string;
    estudianteId: string;
    fecha: string;
    modalidad: string;
    estado: string;
    registradoPor?: string;
  }[] = [];

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("estado_")) continue;
    const estudianteId = key.slice("estado_".length);
    const estado = String(value);
    if (!ESTADOS.includes(estado as (typeof ESTADOS)[number])) continue;
    filas.push({ cursoId, estudianteId, fecha, modalidad, estado, registradoPor: usuario.id });
  }

  if (filas.length === 0) return;

  for (const fila of filas) {
    await db
      .insert(asistencias)
      .values(fila)
      .onConflictDoUpdate({
        target: [asistencias.cursoId, asistencias.estudianteId, asistencias.fecha],
        set: { estado: sql`excluded.estado`, modalidad: sql`excluded.modalidad` },
      });
  }

  revalidatePath("/", "layout");
}
