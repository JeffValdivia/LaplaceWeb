import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { sedes, asignaturas, grupos, cursos, usuarios } from "@/lib/db/schema";
import { listarDocentes } from "@/lib/docentes";
import { NuevaAsignaturaModal } from "./nueva-asignatura-modal";
import { AsignaturaCard } from "./asignatura-card";
import { SedeDesplegable } from "./sede-desplegable";

export default async function SedesPage() {
  const [listaSedes, filasAsignaturas, listaDocentes] = await Promise.all([
    db
      .select({
        id: sedes.id,
        nombre: sedes.nombre,
        descripcion: sedes.descripcion,
        cantidadGrupos: sql<number>`count(distinct ${grupos.id})`.mapWith(Number),
      })
      .from(sedes)
      .leftJoin(grupos, eq(grupos.sedeId, sedes.id))
      .groupBy(sedes.id)
      .orderBy(asc(sedes.nombre)),
    db
      .select({
        id: asignaturas.id,
        nombre: asignaturas.nombre,
        sedeId: asignaturas.sedeId,
        docenteId: asignaturas.docenteId,
        grupoNombre: grupos.nombre,
        cursoDocenteId: cursos.docenteId,
        cursoDocenteNombre: usuarios.nombreCompleto,
      })
      .from(asignaturas)
      .leftJoin(cursos, eq(cursos.asignaturaId, asignaturas.id))
      .leftJoin(grupos, eq(grupos.id, cursos.grupoId))
      .leftJoin(usuarios, eq(usuarios.id, cursos.docenteId))
      .orderBy(asc(asignaturas.nombre)),
    listarDocentes(),
  ]);

  const nombrePorDocente = new Map(listaDocentes.map((d) => [d.id, d.nombreCompleto]));

  // Cada asignatura puede salir en varias filas (una por curso/grupo que la
  // dicta); se agrupan aquí para mostrar todos sus cursos juntos.
  type Dictado = { grupoNombre: string; docenteId: string; docenteNombre: string };
  const asignaturasPorId = new Map<
    string,
    {
      id: string;
      nombre: string;
      sedeId: string;
      docenteId: string | null;
      docenteNombre: string | null;
      dictados: Dictado[];
    }
  >();
  for (const fila of filasAsignaturas) {
    let entrada = asignaturasPorId.get(fila.id);
    if (!entrada) {
      entrada = {
        id: fila.id,
        nombre: fila.nombre,
        sedeId: fila.sedeId,
        docenteId: fila.docenteId,
        docenteNombre: fila.docenteId ? nombrePorDocente.get(fila.docenteId) ?? null : null,
        dictados: [],
      };
      asignaturasPorId.set(fila.id, entrada);
    }
    if (fila.grupoNombre && fila.cursoDocenteId && fila.cursoDocenteNombre) {
      entrada.dictados.push({
        grupoNombre: fila.grupoNombre,
        docenteId: fila.cursoDocenteId,
        docenteNombre: fila.cursoDocenteNombre,
      });
    }
  }
  const listaAsignaturas = [...asignaturasPorId.values()];

  const docentesOpciones = listaDocentes.map((d) => ({
    id: d.id,
    nombreCompleto: d.nombreCompleto,
    sedeId: d.sedeId,
  }));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Asignaturas</h1>
          <p className="text-sm text-ink-soft">
            Cada asignatura es propia de una sede y puede tener un docente
            predeterminado: al agregarla a un grupo, ese docente se propone
            solo (se puede cambiar en cada curso).
          </p>
        </div>
        <NuevaAsignaturaModal
          sedes={listaSedes.map((s) => ({ id: s.id, nombre: s.nombre }))}
          docentes={docentesOpciones}
        />
      </div>

      <div className="flex flex-col gap-4">
        {listaSedes.map((sede) => {
          const asignaturasDeLaSede = listaAsignaturas.filter((a) => a.sedeId === sede.id);
          return (
            <SedeDesplegable
              key={sede.id}
              sedeNombre={sede.nombre}
              conteo={asignaturasDeLaSede.length}
            >
              <div className="flex justify-end">
                <Link
                  href={`/sedes/${sede.id}`}
                  className="text-xs font-medium text-brand-blue hover:underline"
                >
                  Gestionar grupos de esta sede →
                </Link>
              </div>
              {asignaturasDeLaSede.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {asignaturasDeLaSede.map((a) => (
                    <AsignaturaCard key={a.id} asignatura={a} docentes={docentesOpciones} />
                  ))}
                </div>
              ) : (
                <p className="surface-card px-4 py-6 text-center text-sm text-ink-soft">
                  Esta sede todavía no tiene asignaturas.
                </p>
              )}
            </SedeDesplegable>
          );
        })}
      </div>
    </div>
  );
}
