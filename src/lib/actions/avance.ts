"use server";

import { revalidatePath } from "next/cache";
import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { avancesClase, avancesAdjuntos, cursos } from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { guardarArchivo, borrarArchivo } from "@/lib/storage";

async function puedeEditarCurso(usuario: NonNullable<Awaited<ReturnType<typeof obtenerUsuarioActual>>>, cursoId: string) {
  if (usuario.rol === "admin") return true;
  if (usuario.rol !== "docente") return false;

  const [curso] = await db
    .select({ id: cursos.id })
    .from(cursos)
    .where(and(eq(cursos.id, cursoId), eq(cursos.docenteId, usuario.id)))
    .limit(1);
  return Boolean(curso);
}

// Guarda en disco (reutilizando el mismo almacenamiento de "Campus
// virtual") y registra una fila en avances_adjuntos por cada imagen/archivo
// nuevo del formulario. Ignora en silencio archivos de 0 bytes (campos de
// tipo file vacíos que igual llegan en el FormData).
async function guardarAdjuntosNuevos(formData: FormData, avanceId: string, cursoId: string) {
  const imagenes = formData.getAll("imagenes").filter((f): f is File => f instanceof File && f.size > 0);
  const archivos = formData.getAll("archivos").filter((f): f is File => f instanceof File && f.size > 0);

  for (const file of imagenes) {
    const archivoPath = await guardarArchivo(cursoId, file);
    await db.insert(avancesAdjuntos).values({
      avanceId,
      tipo: "imagen",
      nombre: file.name,
      archivoPath,
      tipoArchivo: file.type || null,
      tamanoBytes: file.size,
    });
  }
  for (const file of archivos) {
    const archivoPath = await guardarArchivo(cursoId, file);
    await db.insert(avancesAdjuntos).values({
      avanceId,
      tipo: "archivo",
      nombre: file.name,
      archivoPath,
      tipoArchivo: file.type || null,
      tamanoBytes: file.size,
    });
  }
}

export async function registrarAvance(_prevState: string | null, formData: FormData) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return "Tu sesión expiró, vuelve a iniciar sesión.";

  const cursoId = String(formData.get("curso_id") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const tema = String(formData.get("tema") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;

  if (!cursoId || !fecha || !tema) return "Completa la fecha y el tema dictado.";
  if (!(await puedeEditarCurso(usuario, cursoId))) return "No dictas ese curso.";

  const [nuevo] = await db
    .insert(avancesClase)
    .values({ cursoId, fecha, tema, descripcion, registradoPor: usuario.id })
    .returning({ id: avancesClase.id });

  await guardarAdjuntosNuevos(formData, nuevo.id, cursoId);

  revalidatePath("/", "layout");
  return null;
}

export async function actualizarAvance(_prevState: string | null, formData: FormData) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return "Tu sesión expiró, vuelve a iniciar sesión.";

  const id = String(formData.get("id") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const tema = String(formData.get("tema") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim() || null;

  if (!id || !fecha || !tema) return "Completa la fecha y el tema dictado.";

  const [avance] = await db
    .select({ cursoId: avancesClase.cursoId })
    .from(avancesClase)
    .where(eq(avancesClase.id, id))
    .limit(1);
  if (!avance) return "Ese registro ya no existe.";
  if (!(await puedeEditarCurso(usuario, avance.cursoId))) return "No dictas ese curso.";

  await db.update(avancesClase).set({ fecha, tema, descripcion }).where(eq(avancesClase.id, id));

  const idsAEliminar = formData.getAll("eliminar_adjuntos").map(String).filter(Boolean);
  if (idsAEliminar.length) {
    const aBorrar = await db
      .select({ id: avancesAdjuntos.id, archivoPath: avancesAdjuntos.archivoPath })
      .from(avancesAdjuntos)
      .where(and(eq(avancesAdjuntos.avanceId, id), inArray(avancesAdjuntos.id, idsAEliminar)));
    for (const f of aBorrar) {
      await borrarArchivo(f.archivoPath);
      await db.delete(avancesAdjuntos).where(eq(avancesAdjuntos.id, f.id));
    }
  }

  await guardarAdjuntosNuevos(formData, id, avance.cursoId);

  revalidatePath("/", "layout");
  return null;
}

export async function eliminarAvance(formData: FormData) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const [fila] = await db
    .select({ cursoId: avancesClase.cursoId })
    .from(avancesClase)
    .where(eq(avancesClase.id, id))
    .limit(1);
  if (!fila) return;
  if (!(await puedeEditarCurso(usuario, fila.cursoId))) return;

  const adjuntos = await db
    .select({ archivoPath: avancesAdjuntos.archivoPath })
    .from(avancesAdjuntos)
    .where(eq(avancesAdjuntos.avanceId, id));
  for (const a of adjuntos) await borrarArchivo(a.archivoPath);

  await db.delete(avancesClase).where(eq(avancesClase.id, id));
  revalidatePath("/", "layout");
}
