export async function register() {
  // El proxy corre en runtime edge y también carga este archivo; el
  // código de abajo usa `pg` (driver de Postgres), que solo existe en
  // Node — por eso se limita explícitamente a ese runtime.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { aplicarMigraciones } = await import("@/lib/db/migrate");
    const { iniciarLimpiezaPeriodicaDeSesiones } = await import(
      "@/lib/db/limpieza-sesiones"
    );

    await aplicarMigraciones();
    iniciarLimpiezaPeriodicaDeSesiones();
  }
}
