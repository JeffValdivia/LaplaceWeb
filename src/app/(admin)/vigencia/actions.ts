"use server";

import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matriculas } from "@/lib/db/schema";
import { sumarUnMes, sumarUnDia } from "@/lib/vigencia";

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
