import Link from "next/link";
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
import { SelectorReportes, type GrupoOpcion } from "./selector";

const estadoEstilo: Record<string, string> = {
  activa: "bg-ok-soft text-ok",
  por_vencer: "bg-warn-soft text-warn",
  vencida: "bg-danger-soft text-danger",
  retirada: "bg-line text-ink-soft",
};

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const grupoId = typeof params.grupo_id === "string" ? params.grupo_id : "";
  const filtroEstado = typeof params.estado === "string" ? params.estado : "";

  const [listaSedes, listaGrupos, filasCrudas] = await Promise.all([
    db.select({ id: sedes.id, nombre: sedes.nombre }).from(sedes).orderBy(asc(sedes.nombre)),
    db
      .select({ id: grupos.id, nombre: grupos.nombre, modalidad: grupos.modalidad, sedeId: grupos.sedeId })
      .from(grupos)
      .orderBy(asc(grupos.nombre)),
    db
      .select({
        estudianteId: estudiantes.id,
        dni: estudiantes.dni,
        nombres: estudiantes.nombres,
        apellidos: estudiantes.apellidos,
        grupoId: grupos.id,
        grupoNombre: grupos.nombre,
        fechaIngreso: matriculas.fechaIngreso,
        fechaFin: matriculas.fechaFin,
        retirada: matriculas.retirada,
      })
      .from(matriculas)
      .innerJoin(estudiantes, eq(estudiantes.id, matriculas.estudianteId))
      .leftJoin(grupos, eq(grupos.id, matriculas.grupoId))
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

  const todasConEstado = [...masRecientePorEstudiante.values()].map((f) => ({
    ...f,
    estado: calcularEstado(f.fechaFin, f.retirada),
  }));

  const conteoVigentesPorGrupo = new Map<string, number>();
  for (const f of todasConEstado) {
    if (!f.grupoId || (f.estado !== "activa" && f.estado !== "por_vencer")) continue;
    conteoVigentesPorGrupo.set(f.grupoId, (conteoVigentesPorGrupo.get(f.grupoId) ?? 0) + 1);
  }

  const opcionesGrupos: GrupoOpcion[] = listaGrupos.map((g) => ({
    id: g.id,
    nombre: g.nombre,
    modalidad: g.modalidad,
    sedeId: g.sedeId,
    totalAlumnos: conteoVigentesPorGrupo.get(g.id) ?? 0,
  }));

  const grupoSeleccionado = grupoId ? listaGrupos.find((g) => g.id === grupoId) ?? null : null;
  const sedeDelGrupo = grupoSeleccionado
    ? listaSedes.find((s) => s.id === grupoSeleccionado.sedeId) ?? null
    : null;

  const filasFiltradas = grupoSeleccionado
    ? todasConEstado
        .filter((f) => f.grupoId === grupoSeleccionado.id)
        .filter((f) => !filtroEstado || f.estado === filtroEstado)
        .sort((a, b) => a.apellidos.localeCompare(b.apellidos))
    : [];

  const estudianteIds = filasFiltradas.map((f) => f.estudianteId);

  const [asistenciasFilas, evaluacionesFilas, intentosFilas] = await Promise.all([
    estudianteIds.length
      ? db
          .select({ estudianteId: asistencias.estudianteId, estado: asistencias.estado })
          .from(asistencias)
          .where(inArray(asistencias.estudianteId, estudianteIds))
      : Promise.resolve([]),
    grupoSeleccionado
      ? db
          .select({ id: evaluaciones.id, grupoId: cursos.grupoId, puntaje: preguntas.puntaje })
          .from(evaluaciones)
          .innerJoin(cursos, eq(cursos.id, evaluaciones.cursoId))
          .leftJoin(preguntas, eq(preguntas.evaluacionId, evaluaciones.id))
          .where(eq(cursos.grupoId, grupoSeleccionado.id))
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
  const totalEvaluacionesGrupo = new Set(evaluacionesFilas.map((e) => e.id)).size;

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
    grupo: grupoSeleccionado?.nombre ?? "",
    estadoMatricula: f.estadoMatricula,
    asistenciaPct: f.asistenciaPct === null ? "—" : `${f.asistenciaPct}%`,
    evaluacionesRendidas: f.evaluacionesRendidas,
    promedio: f.promedio === null ? "—" : `${f.promedio}%`,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Módulo central de reportes</h1>
        <p className="text-sm text-ink-soft">
          Elige la sede y el grupo para ver vigencia, asistencia y evaluaciones consolidadas por
          estudiante.
        </p>
      </div>

      <SelectorReportes
        sedes={listaSedes}
        grupos={opcionesGrupos}
        grupoActual={
          grupoSeleccionado && sedeDelGrupo
            ? { sedeNombre: sedeDelGrupo.nombre, grupoNombre: grupoSeleccionado.nombre }
            : null
        }
      />

      {grupoSeleccionado ? (
        <>
          <form className="flex flex-wrap items-end gap-3 surface-card p-4 print:hidden">
            <input type="hidden" name="grupo_id" value={grupoSeleccionado.id} />
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
            <button
              type="submit"
              className="rounded-md bg-gradient-to-r from-brand-navy to-brand-blue px-4 py-2 text-sm font-medium text-white hover:brightness-110 hover:shadow-lg transition-all duration-200"
            >
              Filtrar
            </button>
            <div className="ml-auto">
              <ExportarReporteButton filas={filasExport} />
            </div>
          </form>

          <div className="overflow-x-auto surface-card">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-soft">
                  <th className="px-4 py-3 font-medium">DNI</th>
                  <th className="px-4 py-3 font-medium">Estudiante</th>
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
                      <Link
                        href={`/asistencia/alumno/${f.estudianteId}`}
                        className="text-brand-blue hover:underline"
                      >
                        {f.nombres} {f.apellidos}
                      </Link>
                    </td>
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
                    <td colSpan={6} className="px-4 py-6 text-center text-ink-soft">
                      No hay alumnos con esos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="surface-card px-4 py-10 text-center text-sm text-ink-soft">
          Elige una sede y luego un grupo para ver el reporte.
        </p>
      )}
    </div>
  );
}
