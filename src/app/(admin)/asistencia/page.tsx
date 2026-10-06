import Link from "next/link";
import { asc, and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  grupos,
  sedes,
  asignaturas,
  cursos,
  usuarios,
  matriculas,
  estudiantes,
  asistencias,
} from "@/lib/db/schema";
import { calcularEstado } from "@/lib/vigencia";
import { guardarAsistencia } from "@/lib/actions/asistencia";
import { SelectorAsistencia, type GrupoOpcion } from "./selector";

const hoy = new Date().toISOString().slice(0, 10);

export default async function AsistenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const cursoId = typeof params.curso_id === "string" ? params.curso_id : "";
  const fecha = typeof params.fecha === "string" ? params.fecha : hoy;
  const modalidad = typeof params.modalidad === "string" ? params.modalidad : "presencial";

  const [listaSedes, listaCursos] = await Promise.all([
    db.select({ id: sedes.id, nombre: sedes.nombre }).from(sedes).orderBy(asc(sedes.nombre)),
    db
      .select({
        id: cursos.id,
        grupoId: cursos.grupoId,
        grupoNombre: grupos.nombre,
        grupoModalidad: grupos.modalidad,
        sedeId: sedes.id,
        sedeNombre: sedes.nombre,
        asignaturaNombre: asignaturas.nombre,
        docenteNombre: usuarios.nombreCompleto,
      })
      .from(cursos)
      .innerJoin(grupos, eq(grupos.id, cursos.grupoId))
      .innerJoin(sedes, eq(sedes.id, grupos.sedeId))
      .innerJoin(asignaturas, eq(asignaturas.id, cursos.asignaturaId))
      .innerJoin(usuarios, eq(usuarios.id, cursos.docenteId))
      .where(eq(grupos.activo, true))
      .orderBy(asc(grupos.nombre), asc(asignaturas.nombre)),
  ]);

  const gruposMap = new Map<string, GrupoOpcion>();
  for (const c of listaCursos) {
    if (!c.grupoId) continue;
    const g =
      gruposMap.get(c.grupoId) ??
      ({
        id: c.grupoId,
        nombre: c.grupoNombre,
        modalidad: c.grupoModalidad,
        sedeId: c.sedeId,
        cursos: [],
      } satisfies GrupoOpcion);
    g.cursos.push({ id: c.id, asignaturaNombre: c.asignaturaNombre, docenteNombre: c.docenteNombre });
    gruposMap.set(c.grupoId, g);
  }
  const listaGrupos = [...gruposMap.values()];

  let roster: { estudianteId: string; dni: string; nombres: string; apellidos: string; fechaFin: string; retirada: boolean }[] = [];
  let existentes: Record<string, string> = {};
  const cursoActual = listaCursos.find((c) => c.id === cursoId);

  if (cursoActual?.grupoId) {
    const matriculasCrudas = await db
      .select({
        estudianteId: estudiantes.id,
        dni: estudiantes.dni,
        nombres: estudiantes.nombres,
        apellidos: estudiantes.apellidos,
        fechaIngreso: matriculas.fechaIngreso,
        fechaFin: matriculas.fechaFin,
        retirada: matriculas.retirada,
      })
      .from(matriculas)
      .innerJoin(estudiantes, eq(estudiantes.id, matriculas.estudianteId))
      .where(eq(matriculas.grupoId, cursoActual.grupoId))
      .orderBy(asc(estudiantes.apellidos));

    // Un estudiante puede tener varias matrículas en el mismo grupo (por
    // renovaciones) — solo la más reciente cuenta, igual que en el resto
    // del sistema. Sin esto, salía duplicado en la lista de asistencia.
    const masRecientePorEstudiante = new Map<string, (typeof matriculasCrudas)[number]>();
    for (const m of matriculasCrudas) {
      const actual = masRecientePorEstudiante.get(m.estudianteId);
      if (!actual || m.fechaIngreso > actual.fechaIngreso) {
        masRecientePorEstudiante.set(m.estudianteId, m);
      }
    }
    const matriculados = [...masRecientePorEstudiante.values()].sort((a, b) =>
      a.apellidos.localeCompare(b.apellidos)
    );

    roster = matriculados.filter((m) => {
      const estado = calcularEstado(m.fechaFin, m.retirada);
      return estado === "activa" || estado === "por_vencer";
    });

    if (roster.length) {
      const previas = await db
        .select({ estudianteId: asistencias.estudianteId, estado: asistencias.estado })
        .from(asistencias)
        .where(
          and(
            eq(asistencias.cursoId, cursoId),
            eq(asistencias.fecha, fecha),
            inArray(
              asistencias.estudianteId,
              roster.map((r) => r.estudianteId)
            )
          )
        );
      existentes = Object.fromEntries(previas.map((p) => [p.estudianteId, p.estado]));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Asistencia</h1>
        <p className="text-sm text-ink-soft">
          Elige la sede y el grupo, luego la fecha y modalidad para tomar asistencia.
        </p>
      </div>

      <SelectorAsistencia
        sedes={listaSedes}
        grupos={listaGrupos}
        cursoActual={
          cursoActual
            ? {
                sedeNombre: cursoActual.sedeNombre,
                grupoNombre: cursoActual.grupoNombre,
                asignaturaNombre: cursoActual.asignaturaNombre,
              }
            : null
        }
        fecha={fecha}
        modalidad={modalidad}
      />

      {cursoActual && (
        <>
          <form className="flex flex-wrap items-end gap-3 surface-card p-4">
            <input type="hidden" name="curso_id" value={cursoId} />
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Fecha</span>
              <input
                type="date"
                name="fecha"
                defaultValue={fecha}
                className="rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Modalidad</span>
              <select
                name="modalidad"
                defaultValue={modalidad}
                className="rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
              >
                <option value="presencial">Presencial</option>
                <option value="virtual">Virtual</option>
              </select>
            </label>
            <button
              type="submit"
              className="rounded-md bg-gradient-to-r from-brand-navy to-brand-blue px-4 py-2 text-sm font-medium text-white hover:brightness-110 hover:shadow-lg transition-all duration-200"
            >
              Cargar lista
            </button>
            <Link
              href="/asistencia/alumno"
              className="ml-auto rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:border-brand-blue hover:text-brand-blue"
            >
              Reporte por alumno
            </Link>
            <Link
              href={`/asistencia/reporte?curso_id=${cursoId}`}
              className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:border-brand-blue hover:text-brand-blue"
            >
              Reporte mensual (PDF)
            </Link>
          </form>

          <form
            action={guardarAsistencia}
            className="flex flex-col gap-4 surface-card p-5"
          >
            <input type="hidden" name="curso_id" value={cursoId} />
            <input type="hidden" name="fecha" value={fecha} />
            <input type="hidden" name="modalidad" value={modalidad} />

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-soft">
                    <th className="px-3 py-2 font-medium">DNI</th>
                    <th className="px-3 py-2 font-medium">Estudiante</th>
                    <th className="px-3 py-2 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((r) => (
                    <tr key={r.estudianteId} className="border-b border-line last:border-0">
                      <td className="px-3 py-2 font-mono-tab text-ink-soft">{r.dni}</td>
                      <td className="px-3 py-2 text-ink">
                        {r.nombres} {r.apellidos}
                      </td>
                      <td className="px-3 py-2">
                        <select
                          name={`estado_${r.estudianteId}`}
                          defaultValue={existentes[r.estudianteId] ?? "presente"}
                          className="rounded-md border border-line bg-bg px-2 py-1 text-sm outline-none focus:border-brand-blue"
                        >
                          <option value="presente">Presente</option>
                          <option value="tardanza">Tardanza</option>
                          <option value="falta">Falta</option>
                          <option value="justificado">Justificado</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {!roster.length && (
                    <tr>
                      <td colSpan={3} className="px-3 py-6 text-center text-ink-soft">
                        Ese curso no tiene matriculados activos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {roster.length > 0 && (
              <button
                type="submit"
                className="self-start rounded-md bg-gradient-to-r from-brand-navy to-brand-blue px-4 py-2 text-sm font-medium text-white hover:brightness-110 hover:shadow-lg transition-all duration-200"
              >
                Guardar asistencia
              </button>
            )}
          </form>
        </>
      )}
    </div>
  );
}
