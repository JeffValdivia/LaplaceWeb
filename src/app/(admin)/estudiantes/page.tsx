import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matriculas, grupos, sedes, estudiantes, carreras } from "@/lib/db/schema";
import { calcularEstado } from "@/lib/vigencia";
import { temaPorSede } from "@/lib/tema-sede";
import { GrupoAlumnosCard, type AlumnoGrupo } from "./grupo-alumnos-card";
import { MatricularEstudianteModal } from "./matricular-modal";

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

export default async function EstudiantesPage() {
  const [listaSedes, listaGrupos, listaCarreras, matriculasCrudas] = await Promise.all([
    db.select().from(sedes).orderBy(asc(sedes.nombre)),
    db
      .select({
        id: grupos.id,
        nombre: grupos.nombre,
        modalidad: grupos.modalidad,
        sedeId: grupos.sedeId,
      })
      .from(grupos)
      .where(eq(grupos.activo, true))
      .orderBy(asc(grupos.nombre)),
    db
      .select({ id: carreras.id, nombre: carreras.nombre })
      .from(carreras)
      .where(eq(carreras.activo, true))
      .orderBy(asc(carreras.nombre)),
    db
      .select({
        estudianteId: matriculas.estudianteId,
        grupoId: matriculas.grupoId,
        fechaIngreso: matriculas.fechaIngreso,
        fechaFin: matriculas.fechaFin,
        retirada: matriculas.retirada,
        dni: estudiantes.dni,
        nombres: estudiantes.nombres,
        apellidos: estudiantes.apellidos,
      })
      .from(matriculas)
      .innerJoin(estudiantes, eq(estudiantes.id, matriculas.estudianteId))
      .orderBy(desc(matriculas.fechaIngreso)),
  ]);

  // Un estudiante puede tener varias matrículas (por renovaciones); para
  // contar solo importa la más reciente de cada uno, igual que en el
  // dashboard — si ya renovó, su matrícula vieja no debe seguir sumando.
  const masRecientePorEstudiante = new Map<string, (typeof matriculasCrudas)[number]>();
  for (const m of matriculasCrudas) {
    if (!masRecientePorEstudiante.has(m.estudianteId)) {
      masRecientePorEstudiante.set(m.estudianteId, m);
    }
  }

  const alumnosPorGrupo = new Map<string, AlumnoGrupo[]>();
  for (const m of masRecientePorEstudiante.values()) {
    if (!m.grupoId) continue;
    const estado = calcularEstado(m.fechaFin, m.retirada);
    if (estado === "retirada" || estado === "vencida") continue;
    const lista = alumnosPorGrupo.get(m.grupoId) ?? [];
    lista.push({
      dni: m.dni,
      nombres: m.nombres,
      apellidos: m.apellidos,
      fechaFin: m.fechaFin,
      estado,
    });
    alumnosPorGrupo.set(m.grupoId, lista);
  }
  for (const lista of alumnosPorGrupo.values()) {
    lista.sort((a, b) => a.apellidos.localeCompare(b.apellidos));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Estudiantes y matrículas</h1>
          <p className="text-sm text-ink-soft">
            Alumnos matriculados por grupo (activos y por vencer). El detalle,
            renovaciones y retiros están en{" "}
            <Link href="/vigencia" className="underline">
              Vigencia de matrícula
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/estudiantes/importar"
            className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition hover:border-brand-blue hover:text-brand-blue"
          >
            Cargar Excel
          </Link>
          <MatricularEstudianteModal sedes={listaSedes} grupos={listaGrupos} carreras={listaCarreras} />
        </div>
      </div>

      {listaSedes.map((s) => {
        const gruposDeLaSede = listaGrupos.filter((g) => g.sedeId === s.id);
        return (
          <div
            key={s.id}
            className="flex flex-col gap-4 surface-card p-5"
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">
              {s.nombre}
            </h2>
            {gruposDeLaSede.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {gruposDeLaSede.map((g) => (
                  <GrupoAlumnosCard
                    key={g.id}
                    grupoId={g.id}
                    nombre={g.nombre}
                    modalidad={modalidadEtiqueta[g.modalidad] ?? g.modalidad}
                    alumnos={alumnosPorGrupo.get(g.id) ?? []}
                    tema={temaPorSede[s.nombre]}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm italic text-ink-soft">Esta sede todavía no tiene grupos.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
