import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matriculas, grupos, sedes, estudiantes } from "@/lib/db/schema";
import { calcularEstado } from "@/lib/vigencia";
import { FiltroReporteAlumnos, type GrupoConAlumnos } from "./filtro";

export default async function ReporteAlumnosPage() {
  const [listaSedes, listaGrupos, matriculasCrudas] = await Promise.all([
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
      .select({
        estudianteId: estudiantes.id,
        dni: estudiantes.dni,
        nombres: estudiantes.nombres,
        apellidos: estudiantes.apellidos,
        grupoId: matriculas.grupoId,
        fechaIngreso: matriculas.fechaIngreso,
        fechaFin: matriculas.fechaFin,
        retirada: matriculas.retirada,
      })
      .from(matriculas)
      .innerJoin(estudiantes, eq(estudiantes.id, matriculas.estudianteId)),
  ]);

  // Igual que en "Estudiantes y matrículas": solo la matrícula más reciente
  // de cada alumno cuenta, y solo entran los vigentes (activa o por vencer).
  const masRecientePorEstudiante = new Map<string, (typeof matriculasCrudas)[number]>();
  for (const m of matriculasCrudas) {
    const actual = masRecientePorEstudiante.get(m.estudianteId);
    if (!actual || m.fechaIngreso > actual.fechaIngreso) {
      masRecientePorEstudiante.set(m.estudianteId, m);
    }
  }

  const alumnosPorGrupo = new Map<
    string,
    { id: string; dni: string; nombres: string; apellidos: string }[]
  >();
  for (const m of masRecientePorEstudiante.values()) {
    if (!m.grupoId) continue;
    const estado = calcularEstado(m.fechaFin, m.retirada);
    if (estado === "retirada" || estado === "vencida") continue;
    const lista = alumnosPorGrupo.get(m.grupoId) ?? [];
    lista.push({ id: m.estudianteId, dni: m.dni, nombres: m.nombres, apellidos: m.apellidos });
    alumnosPorGrupo.set(m.grupoId, lista);
  }
  for (const lista of alumnosPorGrupo.values()) {
    lista.sort((a, b) => `${a.apellidos} ${a.nombres}`.localeCompare(`${b.apellidos} ${b.nombres}`));
  }

  const gruposConAlumnos: GrupoConAlumnos[] = listaGrupos.map((g) => ({
    id: g.id,
    nombre: g.nombre,
    modalidad: g.modalidad,
    sedeId: g.sedeId,
    alumnos: alumnosPorGrupo.get(g.id) ?? [],
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Reporte de alumnos</h1>
        <p className="text-sm text-ink-soft">
          Elige primero la sede y luego el grupo para generar su lista de
          alumnos — con membrete, numerada, por DNI y apellidos y nombres en
          orden alfabético — lista para imprimir o guardar como PDF.
        </p>
      </div>

      <FiltroReporteAlumnos sedes={listaSedes} grupos={gruposConAlumnos} />
    </div>
  );
}
