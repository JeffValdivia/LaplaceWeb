import "server-only";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./index";

const INTENTOS = 10;
const ESPERA_ENTRE_INTENTOS_MS = 2000;

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Aplica las migraciones pendientes de ./drizzle contra la base conectada.
// Se llama una sola vez al arrancar el servidor (ver instrumentation.ts).
// Es segura de repetir: si ya están aplicadas, no hace nada (drizzle lleva
// su propio registro en drizzle.__drizzle_migrations).
//
// Reintenta con espera porque en producción el contenedor de Postgres
// puede tardar unos segundos más en aceptar conexiones que el de la app,
// y `depends_on` en docker-compose solo garantiza el orden de arranque,
// no que la base ya esté lista.
export async function aplicarMigraciones() {
  for (let intento = 1; intento <= INTENTOS; intento++) {
    try {
      await migrate(db, { migrationsFolder: "./drizzle" });
      return;
    } catch (err) {
      if (intento === INTENTOS) throw err;
      console.warn(
        `[migraciones] intento ${intento}/${INTENTOS} falló, reintentando en ${ESPERA_ENTRE_INTENTOS_MS}ms:`,
        err instanceof Error ? err.message : err
      );
      await esperar(ESPERA_ENTRE_INTENTOS_MS);
    }
  }
}
