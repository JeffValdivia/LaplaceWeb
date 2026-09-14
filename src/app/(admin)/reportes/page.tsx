import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  matriculas,
  estudiantes,
  grupos,
  sedes,
  asistencias,
  evaluaciones,
  cursos,
  preguntas,
  intentos,
} from "@/lib/db/schema";
import { calcularEstado } from "@/lib/vigencia";
import { ExportarReporteButton } from "./export-button";

const estadoEstilo: Record<string, string> = {
  activa: "bg-ok-soft text-ok",
  por_vencer: "bg-warn-soft text-warn",
  vencida: "bg-danger-soft text-danger",
  retirada: "bg-line text-ink-soft",
};

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filtroEstado = typeof params.estado === "string" ? params.estado : "";
  const filtroSede = typeof params.sede === "string" ? params.sede : "";
  const filtroModalidad = typeof params.modalidad === "string" ? params.modalidad : "";

  const [listaSedes, filasCrudas] = await Promise.all([
    db.select().from(sedes).orderBy(asc(sedes.nombre)),
    db
      .select({
        estudianteId: estudiantes.id,
        dni: estudiantes.dni,
        nombres: estudiantes.nombres,
        apellidos: estudiantes.apellidos,
        grupoId: grupos.id,
        grupoNombre: grupos.nombre,
        modalidad: grupos.modalidad,
        sedeNombre: sedes.nombre,
        fechaIngreso: matriculas.fechaIngreso,
        fechaFin: matriculas.fechaFin,
        retirada: matriculas.retirada,
      })
      .from(matriculas)
      .innerJoin(estudiantes, eq(estudiantes.id, matriculas.estudianteId))
      .innerJoin(grupos, eq(grupos.id, matriculas.grupoId))
      .innerJoin(sedes, eq(sedes.id, grupos.sedeId))
      .orderBy(desc(matriculas.fechaIngreso)),
  ]);

  // Un estudiante puede tener varias matrículas históricas (renovaciones);
  // el reporte solo debe mostrar la más reciente de cada uno.
  const masRecientePorEstudiante = new Map<string, (typeof filasCrudas)[number]>();
  for (const f of filasCrudas) {
    if (!masRecientePorEstudiante.has(f.estudianteId)) {
      masRecientePorEstudiante.set(f.estudianteId, f);
    }
  }

  const filasFiltradas = [...masRecientePorEstudiante.values()]
    .map((f) => ({ ...f, estado: calcularEstado(f.fechaFin, f.retirada) }))
    .filter((f) => !filtroEstado || f.estado === filtroEstado)
    .filter((f) => !filtroSede || f.sedeNombre === filtroSede)
    .filter((f) => !filtroModalidad || f.modalidad === filtroModalidad)
    .sort((a, b) => a.apellidos.localeCompare(b.apellidos));

  const estudianteIds = [...new Set(filasFiltradas.map((f) => f.estudianteId))];
  const grupoIds = [...new Set(filasFiltradas.map((f) => f.grupoId))];

  const [asistenciasFilas, evaluacionesFilas, intentosFilas] = await Promise.all([
    estudianteIds.length
      ? db
          .select({ estudianteId: asistencias.estudianteId, estado: asistencias.estado })
          .from(asistencias)
          .where(inArray(asistencias.estudianteId, estudianteIds))
      : Promise.resolve([]),
    grupoIds.length
      ? db
          .select({ id: evaluaciones.id, grupoId: cursos.grupoId, puntaje: preguntas.puntaje })
          .from(evaluaciones)
          .innerJoin(cursos, eq(cursos.id, evaluaciones.cursoId))
          .leftJoin(preguntas, eq(preguntas.evaluacionId, evaluaciones.id))
          .where(inArray(cursos.grupoId, grupoIds))
      : Promise.resolve([]),
    estudianteIds.length
      ? db
          .select({
            estudianteId: intentos.estudianteId,
            evaluacionId: intentos.evaluacionId,
            puntajeObtenido: intentos.puntajeObtenido,
            entregadoAt: intentos.entregadoAt,
          })
          .from(intentos)
          .where(inArray(intentos.estudianteId, estudianteIds))
      : Promise.resolve([]),
  ]);

  const totalPorEvaluacion = new Map<string, number>();
  for (const e of evaluacionesFilas) {
    totalPorEvaluacion.set(
      e.id,
      (totalPorEvaluacion.get(e.id) ?? 0) + Number(e.puntaje ?? 0)
    );
  }
  const evaluacionesPorGrupo = new Map<string, Set<string>>();
  for (const e of evaluacionesFilas) {
    const set = evaluacionesPorGrupo.get(e.grupoId) ?? new Set<string>();
    set.add(e.id);
    evaluacionesPorGrupo.set(e.grupoId, set);
  }

  const filas = filasFiltradas.map((f) => {
    const asistenciaEstudiante = asistenciasFilas.filter((a) => a.estudianteId === f.estudianteId);
    const presentes = asistenciaEstudiante.filter(
      (a) => a.estado === "presente" || a.estado === "tardanza"
    ).length;
    const asistenciaPct = asistenciaEstudiante.length
      ? Math.round((presentes / asistenciaEstudiante.length) * 100)
      : null;

    const intentosEstudiante = intentosFilas.filter(
      (i) => i.estudianteId === f.estudianteId && i.entregadoAt
    );
    const totalEvaluacionesGrupo = evaluacionesPorGrupo.get(f.grupoId)?.size ?? 0;
    const porcentajes = intentosEstudiante
      .map((i) => {
        const total = totalPorEvaluacion.get(i.evaluacionId) ?? 0;
        return total > 0 ? (Number(i.puntajeObtenido ?? 0) / total) * 100 : null;
      })
      .filter((p): p is number => p !== null);
    const promedio = porcentajes.length
      ? Math.round(porcentajes.reduce((a, b) => a + b, 0) / porcentajes.length)
      : null;

    return {
      estudianteId: f.estudianteId,
      dni: f.dni,
      nombres: f.nombres,
      apellidos: f.apellidos,
      grupo: `${f.sedeNombre} · ${modalidadEtiqueta[f.modalidad] ?? f.modalidad} · ${f.grupoNombre}`,
      estadoMatricula: f.estado,
      asistenciaPct,
      evaluacionesRendidas: `${intentosEstudiante.length}/${totalEvaluacionesGrupo}`,
      promedio,
    };
  });

  const filasExport = filas.map((f) => ({
    dni: f.dni,
    nombres: f.nombres,
    apellidos: f.apellidos,
    grupo: f.grupo,
    estadoMatricula: f.estadoMatricula,
    asistenciaPct: f.asistenciaPct === null ? "—" : `${f.asistenciaPct}%`,
    evaluacionesRendidas: f.evaluacionesRendidas,
    promedio: f.promedio === null ? "—" : `${f.promedio}%`,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Módulo central de reportes</h1>
        <p className="text-sm text-ink-soft">
          Vigencia, asistencia y evaluaciones consolidadas por estudiante. Usa
          Cmd/Ctrl+P para imprimir.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface p-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Estado de matrícula</span>
          <select
            name="estado"
            defaultValue={filtroEstado}
            className="rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
          >
            <option value="">Todos</option>
            <option value="activa">Activa</option>
            <option value="por_vencer">Por vencer</option>
            <option value="vencida">Vencida</option>
            <option value="retirada">Retirada</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Sede</span>
          <select
            name="sede"
            defaultValue={filtroSede}
            className="rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
          >
            <option value="">Todas</option>
            {listaSedes.map((s) => (
              <option key={s.id} value={s.nombre}>
                {s.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Modalidad</span>
          <select
            name="modalidad"
            defaultValue={filtroModalidad}
            className="rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
          >
            <option value="">Todas</option>
            <option value="presencial">Presencial</option>
            <option value="virtual">Virtual</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue"
        >
          Filtrar
        </button>
        <div className="ml-auto">
          <ExportarReporteButton filas={filasExport} />
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-soft">
              <th className="px-4 py-3 font-medium">DNI</th>
              <th className="px-4 py-3 font-medium">Estudiante</th>
              <th className="px-4 py-3 font-medium">Grupo</th>
              <th className="px-4 py-3 font-medium">Matrícula</th>
              <th className="px-4 py-3 font-medium">Asistencia</th>
              <th className="px-4 py-3 font-medium">Evaluaciones</th>
              <th className="px-4 py-3 font-medium">Promedio</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.estudianteId} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-mono-tab text-ink-soft">{f.dni}</td>
                <td className="px-4 py-3 font-medium text-ink">
                  {f.nombres} {f.apellidos}
                </td>
                <td className="px-4 py-3 text-ink-soft">{f.grupo}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${estadoEstilo[f.estadoMatricula]}`}
                  >
                    {f.estadoMatricula}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono-tab text-ink-soft">
                  {f.asistenciaPct === null ? "—" : `${f.asistenciaPct}%`}
                </td>
                <td className="px-4 py-3 font-mono-tab text-ink-soft">
                  {f.evaluacionesRendidas}
                </td>
                <td className="px-4 py-3 font-mono-tab text-ink-soft">
                  {f.promedio === null ? "—" : `${f.promedio}%`}
                </td>
              </tr>
            ))}
            {!filas.length && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink-soft">
                  No hay datos con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
