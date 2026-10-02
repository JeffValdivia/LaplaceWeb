"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { asignaturas } from "@/lib/db/schema";

export async function crearAsignatura(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return;

  await db.insert(asignaturas).values({ nombre });
  revalidatePath("/sedes");
}
