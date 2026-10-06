import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { eventos, sedes, grupos } from "@/lib/db/schema";
import { EventoForm } from "./form";
import { eliminarEvento } from "./actions";

const tipoEstilo: Record<string, string> = {
  academico: "bg-ok-soft text-ok",
  examen: "bg-warn-soft text-warn",
  entrega: "bg-danger-soft text-danger",
};

const tipoTexto: Record<string, string> = {
  academico: "Académico / General",
  examen: "Examen",
  entrega: "Revisión / Entrega",
};

export default async function EventosPage() {
  const [filas, listaSedes, listaGrupos] = await Promise.all([
    db
      .select({
        id: eventos.id,
        titulo: eventos.titulo,
        descripcion: eventos.descripcion,
        fecha: eventos.fecha,
        tipo: eventos.tipo,
        alcance: eventos.alcance,
        sedeNombre: sedes.nombre,
        grupoNombre: grupos.nombre,
      })
      .from(eventos)
      .leftJoin(sedes, eq(sedes.id, eventos.sedeId))
      .leftJoin(grupos, eq(grupos.id, eventos.grupoId))
      .orderBy(desc(eventos.fecha)),
    db.select().from(sedes).orderBy(asc(sedes.nombre)),
    db
      .select({ id: grupos.id, nombre: grupos.nombre, sedeId: grupos.sedeId })
      .from(grupos)
      .where(eq(grupos.activo, true))
      .orderBy(asc(grupos.nombre)),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Eventos del calendario</h1>
        <p className="text-sm text-ink-soft">
          Programa exámenes, entregas y avisos para toda la academia, una sede
          o un grupo — aparecen automáticamente en el calendario del alumno.
        </p>
      </div>

      <EventoForm sedes={listaSedes} grupos={listaGrupos} />

      <div className="flex flex-col gap-3">
        {filas.map((e) => (
          <div
            key={e.id}
            className="flex items-start justify-between gap-4 surface-card p-4"
          >
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-ink">{e.titulo}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tipoEstilo[e.tipo]}`}
                >
                  {tipoTexto[e.tipo]}
                </span>
                <span className="rounded-full bg-brand-blue-light/20 px-2.5 py-0.5 text-xs font-medium text-brand-blue">
                  {e.alcance === "academia"
                    ? "Toda la academia"
                    : e.alcance === "sede"
                      ? e.sedeNombre
                      : e.grupoNombre}
                </span>
              </div>
              {e.descripcion && <p className="text-sm text-ink-soft">{e.descripcion}</p>}
              <p className="font-mono-tab text-xs text-ink-soft">{e.fecha}</p>
            </div>
            <form action={eliminarEvento}>
              <input type="hidden" name="id" value={e.id} />
              <button
                type="submit"
                className="shrink-0 text-xs text-danger underline decoration-dotted hover:decoration-solid"
              >
                Eliminar
              </button>
            </form>
          </div>
        ))}
        {!filas.length && (
          <p className="surface-card px-4 py-6 text-center text-sm text-ink-soft">
            Todavía no hay eventos programados.
          </p>
        )}
      </div>
    </div>
  );
}
