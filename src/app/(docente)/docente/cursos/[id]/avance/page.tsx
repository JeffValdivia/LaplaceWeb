import { notFound, redirect } from "next/navigation";
import { desc, eq, and, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { avancesClase, avancesAdjuntos, cursos } from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { AvanceForm } from "./form";
import { AvanceEntry, type AdjuntoAvance } from "./avance-entry";

export default async function AvanceDocentePage({
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
    .from(avancesClase)
    .where(eq(avancesClase.cursoId, id))
    .orderBy(desc(avancesClase.fecha), desc(avancesClase.createdAt));

  const avanceIds = filas.map((f) => f.id);
  const adjuntosCrudos = avanceIds.length
    ? await db
        .select({
          id: avancesAdjuntos.id,
          avanceId: avancesAdjuntos.avanceId,
          nombre: avancesAdjuntos.nombre,
          tipo: avancesAdjuntos.tipo,
        })
        .from(avancesAdjuntos)
        .where(inArray(avancesAdjuntos.avanceId, avanceIds))
    : [];

  const adjuntosPorAvance = new Map<string, AdjuntoAvance[]>();
  for (const a of adjuntosCrudos) {
    const lista = adjuntosPorAvance.get(a.avanceId) ?? [];
    lista.push({
      id: a.id,
      nombre: a.nombre,
      tipo: a.tipo as "imagen" | "archivo",
      url: `/api/avance-adjuntos/${a.id}`,
    });
    adjuntosPorAvance.set(a.avanceId, lista);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Avance de clase</h1>
        <p className="text-sm text-ink-soft">
          Tu registro de qué se dictó en cada sesión — el "libro de clases" de este curso.
        </p>
      </div>

      <AvanceForm cursoId={id} />

      <div className="flex flex-col gap-3">
        {filas.map((f, i) => (
          <AvanceEntry
            key={f.id}
            avance={f}
            numeroSesion={filas.length - i}
            adjuntos={adjuntosPorAvance.get(f.id) ?? []}
          />
        ))}
        {!filas.length && (
          <p className="rounded-lg border border-line bg-surface px-4 py-6 text-center text-sm text-ink-soft">
            Todavía no registraste ninguna clase dictada.
          </p>
        )}
      </div>
    </div>
  );
}
