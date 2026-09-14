import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sesiones, usuarios } from "@/lib/db/schema";
import { marcarActividad } from "@/lib/activity";

const COOKIE = "sesion_id";
const DURACION_DIAS = 30;

export async function crearSesion(usuarioId: string) {
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + DURACION_DIAS * 24 * 60 * 60 * 1000);

  await db.insert(sesiones).values({ id, usuarioId, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function obtenerUsuarioActual() {
  marcarActividad();

  const cookieStore = await cookies();
  const id = cookieStore.get(COOKIE)?.value;
  if (!id) return null;

  const [fila] = await db
    .select({
      id: usuarios.id,
      email: usuarios.email,
      nombreCompleto: usuarios.nombreCompleto,
      rol: usuarios.rol,
      estudianteId: usuarios.estudianteId,
      expiresAt: sesiones.expiresAt,
    })
    .from(sesiones)
    .innerJoin(usuarios, eq(usuarios.id, sesiones.usuarioId))
    .where(eq(sesiones.id, id))
    .limit(1);

  if (!fila) return null;
  if (fila.expiresAt.getTime() < Date.now()) {
    await cerrarSesion();
    return null;
  }

  return {
    id: fila.id,
    email: fila.email,
    nombreCompleto: fila.nombreCompleto,
    rol: fila.rol,
    estudianteId: fila.estudianteId,
  };
}

export async function cerrarSesion() {
  const cookieStore = await cookies();
  const id = cookieStore.get(COOKIE)?.value;
  if (id) await db.delete(sesiones).where(eq(sesiones.id, id));
  cookieStore.delete(COOKIE);
}
