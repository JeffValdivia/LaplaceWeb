import "server-only";
import { lt } from "drizzle-orm";
import { db } from "./index";
import { sesiones } from "./schema";
import { milisegundosDesdeUltimaActividad } from "@/lib/activity";

const INTERVALO_MS = 5 * 60 * 1000; // revisa cada 5 minutos
const INACTIVIDAD_MINIMA_MS = 60 * 1000; // solo limpia si nadie usó la app en el último minuto

let intervalo: ReturnType<typeof setInterval> | null = null;

async function limpiarSesionesVencidas() {
  if (milisegundosDesdeUltimaActividad() < INACTIVIDAD_MINIMA_MS) return; // en uso ahora, no tocar

  try {
    await db.delete(sesiones).where(lt(sesiones.expiresAt, new Date()));
  } catch (err) {
    console.error("[limpieza-sesiones] error al borrar sesiones vencidas:", err);
  }
}

// Se llama una vez al arrancar el servidor (ver instrumentation.ts).
// No hace falta coordinarla entre instancias: la app corre en un solo
// proceso, y borrar sesiones ya vencidas es una operación idempotente y
// barata aunque dos ticks se solapen.
export function iniciarLimpiezaPeriodicaDeSesiones() {
  if (intervalo) return; // ya está corriendo

  intervalo = setInterval(limpiarSesionesVencidas, INTERVALO_MS);
  intervalo.unref?.();
}
