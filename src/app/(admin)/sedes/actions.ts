"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { sedes, asignaturas } from "@/lib/db/schema";

export async function crearSede(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;
  if (!nombre) return;

  await db.insert(sedes).values({ nombre, descripcion });
  revalidatePath("/sedes");
}

export async function crearAsignatura(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return;

  await db.insert(asignaturas).values({ nombre });
  revalidatePath("/sedes");
}
