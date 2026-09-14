import { redirect } from "next/navigation";
import { desc, eq, or, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { comunicados, matriculas } from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";

export default async function ComunicadosPortalPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario?.estudianteId) redirect("/login");

  const misGrupos = await db
    .select({ grupoId: matriculas.grupoId })
    .from(matriculas)
    .where(eq(matriculas.estudianteId, usuario.estudianteId));
  const grupoIds = misGrupos.map((g) => g.grupoId);

  const filas = await db
    .select()
    .from(comunicados)
    .where(
      grupoIds.length
        ? or(eq(comunicados.alcance, "academia"), inArray(comunicados.grupoId, grupoIds))
        : eq(comunicados.alcance, "academia")
    )
    .orderBy(desc(comunicados.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Comunicados</h1>
        <p className="text-sm text-ink-soft">Avisos de la academia y de tu grupo.</p>
      </div>

      <div className="flex flex-col gap-3">
        {filas.map((c) => (
          <div key={c.id} className="rounded-lg border border-line bg-surface p-4">
            <div className="mb-1 flex items-center justify-between gap-3">
              <p className="font-medium text-ink">{c.titulo}</p>
              <span className="rounded-full bg-brand-blue-light/20 px-2.5 py-0.5 text-xs font-medium text-brand-blue">
                {c.alcance === "academia" ? "Toda la academia" : "Tu grupo"}
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
            Sin comunicados todavía.
          </p>
        )}
      </div>
    </div>
  );
}
