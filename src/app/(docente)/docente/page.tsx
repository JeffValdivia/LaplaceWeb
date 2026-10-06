import { redirect } from "next/navigation";
import { inArray, eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { matriculas, avancesClase } from "@/lib/db/schema";
import { calcularEstado } from "@/lib/vigencia";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { obtenerMisGruposYCursos } from "@/lib/docente-nav";
import { GrupoResumenCard } from "./grupo-resumen-card";

export default async function MisGruposPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");

  const { grupos: listaGrupos, cursosSinGrupo } = await obtenerMisGruposYCursos(usuario.id);

  const grupoIds = listaGrupos.map((g) => g.grupoId);
  const cursoIds = [
    ...listaGrupos.flatMap((g) => g.cursos.map((c) => c.cursoId)),
    ...cursosSinGrupo.map((c) => c.cursoId),
  ];

  const [matriculasCrudas, avancesCrudos] = await Promise.all([
    grupoIds.length
      ? db
          .select({
            estudianteId: matriculas.estudianteId,
            grupoId: matriculas.grupoId,
            fechaIngreso: matriculas.fechaIngreso,
            fechaFin: matriculas.fechaFin,
            retirada: matriculas.retirada,
          })
          .from(matriculas)
          .where(inArray(matriculas.grupoId, grupoIds))
      : Promise.resolve([]),
    cursoIds.length
      ? db
          .select({ cursoId: avancesClase.cursoId, fecha: avancesClase.fecha })
          .from(avancesClase)
          .where(inArray(avancesClase.cursoId, cursoIds))
          .orderBy(desc(avancesClase.fecha))
      : Promise.resolve([]),
  ]);

  // Un estudiante puede tener varias matrículas en el mismo grupo (por
  // renovaciones) — solo la más reciente cuenta, igual que en el resto del
  // sistema, para no inflar el conteo.
  const masRecientePorGrupoEstudiante = new Map<string, (typeof matriculasCrudas)[number]>();
  for (const m of matriculasCrudas) {
    if (!m.grupoId) continue;
    const clave = `${m.grupoId}:${m.estudianteId}`;
    const actual = masRecientePorGrupoEstudiante.get(clave);
    if (!actual || m.fechaIngreso > actual.fechaIngreso) {
      masRecientePorGrupoEstudiante.set(clave, m);
    }
  }
  const estudiantesPorGrupo = new Map<string, number>();
  for (const m of masRecientePorGrupoEstudiante.values()) {
    const estado = calcularEstado(m.fechaFin, m.retirada);
    if (estado === "retirada" || estado === "vencida") continue;
    estudiantesPorGrupo.set(m.grupoId!, (estudiantesPorGrupo.get(m.grupoId!) ?? 0) + 1);
  }

  // La primera fila por curso ya es la más reciente (ordenamos desc arriba).
  const ultimoAvancePorCurso = new Map<string, string>();
  for (const a of avancesCrudos) {
    if (!ultimoAvancePorCurso.has(a.cursoId)) ultimoAvancePorCurso.set(a.cursoId, a.fecha);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Grupos Académicos</h1>
        <p className="text-sm text-ink-soft">
          Toca un grupo para ver tus cursos, cuántos alumnos tiene y acceder rápido a
          cada sección — sin salir de esta página.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {listaGrupos.map((grupo) => (
          <GrupoResumenCard
            key={grupo.grupoId}
            grupo={grupo}
            cantidadEstudiantes={estudiantesPorGrupo.get(grupo.grupoId) ?? 0}
            ultimoAvancePorCurso={ultimoAvancePorCurso}
          />
        ))}
        {cursosSinGrupo.length > 0 && (
          <GrupoResumenCard
            grupo={{
              grupoId: "sin-grupo",
              grupoNombre: "Sin grupo",
              modalidad: "",
              sedeNombre: "Su grupo fue eliminado",
              cursos: cursosSinGrupo,
            }}
            cantidadEstudiantes={0}
            ultimoAvancePorCurso={ultimoAvancePorCurso}
            sinGrupo
          />
        )}
        {!listaGrupos.length && !cursosSinGrupo.length && (
          <p className="col-span-full rounded-lg border border-line bg-surface px-4 py-6 text-center text-sm text-ink-soft">
            Todavía no tienes cursos asignados. Pídele al admin que te asigne
            una asignatura desde Grupos académicos.
          </p>
        )}
      </div>
    </div>
  );
}
