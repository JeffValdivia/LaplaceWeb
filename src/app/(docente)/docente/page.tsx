import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cursos, grupos, sedes, asignaturas } from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { redirect } from "next/navigation";

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

export default async function MisGruposPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");

  const misCursos = await db
    .select({
      cursoId: cursos.id,
      asignaturaNombre: asignaturas.nombre,
      grupoId: grupos.id,
      grupoNombre: grupos.nombre,
      modalidad: grupos.modalidad,
      sedeNombre: sedes.nombre,
    })
    .from(cursos)
    .innerJoin(grupos, eq(grupos.id, cursos.grupoId))
    .innerJoin(sedes, eq(sedes.id, grupos.sedeId))
    .innerJoin(asignaturas, eq(asignaturas.id, cursos.asignaturaId))
    .where(eq(cursos.docenteId, usuario.id))
    .orderBy(asc(grupos.nombre), asc(asignaturas.nombre));

  type GrupoConCursos = {
    grupoId: string;
    grupoNombre: string;
    modalidad: string;
    sedeNombre: string;
    cursos: { cursoId: string; asignaturaNombre: string }[];
  };

  const gruposMap = new Map<string, GrupoConCursos>();
  for (const c of misCursos) {
    const grupo = gruposMap.get(c.grupoId) ?? {
      grupoId: c.grupoId,
      grupoNombre: c.grupoNombre,
      modalidad: c.modalidad,
      sedeNombre: c.sedeNombre,
      cursos: [],
    };
    grupo.cursos.push({ cursoId: c.cursoId, asignaturaNombre: c.asignaturaNombre });
    gruposMap.set(c.grupoId, grupo);
  }
  const listaGrupos = [...gruposMap.values()];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Mis grupos y cursos</h1>
        <p className="text-sm text-ink-soft">
          Entra a un curso para subir recursos, crear evaluaciones o tomar
          asistencia.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {listaGrupos.map((grupo) => (
          <div
            key={grupo.grupoId}
            className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-5"
          >
            <Link
              href={`/docente/grupos/${grupo.grupoId}`}
              className="font-medium text-ink hover:text-brand-blue"
            >
              {grupo.grupoNombre}
            </Link>
            <span className="text-xs text-ink-soft">
              {grupo.sedeNombre} · {modalidadEtiqueta[grupo.modalidad] ?? grupo.modalidad}
            </span>
            <ul className="mt-2 flex flex-col gap-1.5 border-t border-line pt-2">
              {grupo.cursos.map((c) => (
                <li key={c.cursoId}>
                  <Link
                    href={`/docente/cursos/${c.cursoId}`}
                    className="text-sm text-brand-blue hover:underline"
                  >
                    {c.asignaturaNombre}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {!listaGrupos.length && (
          <p className="col-span-full rounded-lg border border-line bg-surface px-4 py-6 text-center text-sm text-ink-soft">
            Todavía no tienes cursos asignados. Pídele al admin que te asigne
            una asignatura desde Grupos académicos.
          </p>
        )}
      </div>
    </div>
  );
}
