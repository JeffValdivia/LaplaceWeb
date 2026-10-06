"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { horarios, cursos } from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";

export async function crearHorario(formData: FormData) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario || usuario.rol !== "admin") return;

  const grupoId = String(formData.get("grupo_id") ?? "");
  const cursoId = String(formData.get("curso_id") ?? "") || null;
  const diaSemana = Number(formData.get("dia_semana") ?? 0);
  const horaInicio = String(formData.get("hora_inicio") ?? "");
  const horaFin = String(formData.get("hora_fin") ?? "");

  if (!grupoId || !diaSemana || diaSemana < 1 || diaSemana > 7 || !horaInicio || !horaFin) return;
  if (horaFin <= horaInicio) return;

  if (cursoId) {
    const [curso] = await db
      .select({ id: cursos.id })
      .from(cursos)
      .where(eq(cursos.id, cursoId))
      .limit(1);
    if (!curso) return;
  }

  await db.insert(horarios).values({
    grupoId,
    cursoId,
    diaSemana,
    horaInicio,
    horaFin,
  });

  revalidatePath("/", "layout");
}

export async function eliminarHorario(formData: FormData) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario || usuario.rol !== "admin") return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.delete(horarios).where(eq(horarios.id, id));
  revalidatePath("/", "layout");
}
