import { notFound, redirect } from "next/navigation";
import { desc, eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { recursos, cursos } from "@/lib/db/schema";
import { eliminarRecurso } from "@/lib/actions/campus";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { SubirRecursoCursoForm } from "./form";

export default async function RecursosDocentePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");

  const { id } = await params;

  const [curso] = await db
    .select({ id: cursos.id })
    .from(cursos)
    .where(and(eq(cursos.id, id), eq(cursos.docenteId, usuario.id)))
    .limit(1);
  if (!curso) notFound();

  const filas = await db
    .select()
    .from(recursos)
    .where(eq(recursos.cursoId, id))
    .orderBy(desc(recursos.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Campus virtual</h1>
        <p className="text-sm text-ink-soft">
          Separatas, guías y material para este curso. Tus estudiantes solo
          pueden verlas y descargarlas.
        </p>
      </div>

      <SubirRecursoCursoForm cursoId={id} />

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-soft">
              <th className="px-4 py-3 font-medium">Recurso</th>
              <th className="px-4 py-3 font-medium">Subido</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filas.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{r.titulo}</p>
                  {r.descripcion && (
                    <p className="text-xs text-ink-soft">{r.descripcion}</p>
                  )}
                </td>
                <td className="px-4 py-3 font-mono-tab text-xs text-ink-soft">
                  {r.createdAt.toLocaleDateString("es-PE")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {r.archivoPath ? (
                      <a
                        href={`/api/recursos/${r.id}`}
                        className="text-xs font-medium text-brand-blue hover:underline"
                      >
                        Descargar
                      </a>
                    ) : (
                      r.enlaceUrl && (
                        <a
                          href={r.enlaceUrl}
                          target="_blank"
                          className="text-xs font-medium text-brand-blue hover:underline"
                        >
                          Ver enlace
                        </a>
                      )
                    )}
                    <form action={eliminarRecurso}>
                      <input type="hidden" name="id" value={r.id} />
                      <button
                        type="submit"
                        className="text-xs text-danger underline decoration-dotted hover:decoration-solid"
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {!filas.length && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-ink-soft">
                  Todavía no subiste nada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
