import { notFound, redirect } from "next/navigation";
import { desc, eq, and, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { comunicados, cursos } from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { ComunicadoGrupoForm } from "./form";

export default async function ComunicadosDocentePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");

  const { id: grupoId } = await params;

  const [curso] = await db
    .select({ id: cursos.id })
    .from(cursos)
    .where(and(eq(cursos.grupoId, grupoId), eq(cursos.docenteId, usuario.id)))
    .limit(1);
  if (!curso) notFound();

  const filas = await db
    .select()
    .from(comunicados)
    .where(or(eq(comunicados.alcance, "academia"), eq(comunicados.grupoId, grupoId)))
    .orderBy(desc(comunicados.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Comunicados</h1>
        <p className="text-sm text-ink-soft">
          Publica un aviso para este grupo. También ves los de toda la
          academia.
        </p>
      </div>

      <ComunicadoGrupoForm grupoId={grupoId} />

      <div className="flex flex-col gap-3">
        {filas.map((c) => (
          <div key={c.id} className="rounded-lg border border-line bg-surface p-4">
            <div className="mb-1 flex items-center justify-between gap-3">
              <p className="font-medium text-ink">{c.titulo}</p>
              <span className="rounded-full bg-brand-blue-light/20 px-2.5 py-0.5 text-xs font-medium text-brand-blue">
                {c.alcance === "academia" ? "Toda la academia" : "Este grupo"}
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
