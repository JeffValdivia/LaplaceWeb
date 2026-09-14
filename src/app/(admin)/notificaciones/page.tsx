import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { comunicados, grupos } from "@/lib/db/schema";
import { ComunicadoForm } from "./form";

export default async function NotificacionesPage() {
  const [filas, listaGrupos] = await Promise.all([
    db
      .select({
        id: comunicados.id,
        titulo: comunicados.titulo,
        mensaje: comunicados.mensaje,
        alcance: comunicados.alcance,
        createdAt: comunicados.createdAt,
        grupoNombre: grupos.nombre,
      })
      .from(comunicados)
      .leftJoin(grupos, eq(grupos.id, comunicados.grupoId))
      .orderBy(desc(comunicados.createdAt)),
    db.select().from(grupos).where(eq(grupos.activo, true)).orderBy(asc(grupos.nombre)),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Notificaciones y comunicados</h1>
        <p className="text-sm text-ink-soft">
          Publica para toda la academia o para un grupo específico.
        </p>
      </div>

      <ComunicadoForm grupos={listaGrupos} />

      <div className="flex flex-col gap-3">
        {filas.map((c) => (
          <div key={c.id} className="rounded-lg border border-line bg-surface p-4">
            <div className="mb-1 flex items-center justify-between gap-3">
              <p className="font-medium text-ink">{c.titulo}</p>
              <span className="rounded-full bg-brand-blue-light/20 px-2.5 py-0.5 text-xs font-medium text-brand-blue">
                {c.alcance === "academia" ? "Toda la academia" : c.grupoNombre}
              </span>
            </div>
            <p className="text-sm text-ink-soft">{c.mensaje}</p>
            <p className="mt-2 font-mono-tab text-xs text-ink-soft">
              {c.createdAt.toLocaleString("es-PE")}
            </p>
          </div>
        ))}
        {!filas.length && (
          <p className="rounded-lg border border-line bg-surface px-4 py-6 text-center text-sm text-ink-soft">
            Todavía no hay comunicados publicados.
          </p>
        )}
      </div>
    </div>
  );
}
