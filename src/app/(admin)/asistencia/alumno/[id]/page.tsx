import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { estudiantes, asistencias, cursos, asignaturas, grupos, sedes } from "@/lib/db/schema";
import { ImprimirButton } from "@/components/imprimir-button";

const estadoEstilo: Record<string, string> = {
  presente: "bg-ok-soft text-ok",
  tardanza: "bg-warn-soft text-warn",
  falta: "bg-danger-soft text-danger",
  justificado: "bg-line text-ink-soft",
};

const estadoTexto: Record<string, string> = {
  presente: "Presente",
  tardanza: "Tardanza",
  falta: "Falta",
  justificado: "Justificado",
};

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

export default async function AsistenciaAlumnoDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const filtroCurso = typeof sp.curso_id === "string" ? sp.curso_id : "";

  const [estudiante] = await db
    .select()
    .from(estudiantes)
    .where(eq(estudiantes.id, id))
    .limit(1);
  if (!estudiante) notFound();

  const filasCrudas = await db
    .select({
      id: asistencias.id,
      fecha: asistencias.fecha,
      estado: asistencias.estado,
      modalidad: asistencias.modalidad,
      cursoId: cursos.id,
      asignaturaNombre: asignaturas.nombre,
      grupoNombre: grupos.nombre,
      sedeNombre: sedes.nombre,
    })
    .from(asistencias)
    .innerJoin(cursos, eq(cursos.id, asistencias.cursoId))
    .innerJoin(asignaturas, eq(asignaturas.id, cursos.asignaturaId))
    .leftJoin(grupos, eq(grupos.id, cursos.grupoId))
    .leftJoin(sedes, eq(sedes.id, grupos.sedeId))
    .where(eq(asistencias.estudianteId, id))
    .orderBy(desc(asistencias.fecha));

  const cursosDelAlumno = [
    ...new Map(filasCrudas.map((f) => [f.cursoId, { id: f.cursoId, nombre: f.asignaturaNombre }])).values(),
  ];

  const filas = filtroCurso ? filasCrudas.filter((f) => f.cursoId === filtroCurso) : filasCrudas;

  const total = filas.length;
  const conteos = { presente: 0, tardanza: 0, falta: 0, justificado: 0 };
  for (const f of filas) conteos[f.estado as keyof typeof conteos]++;
  const asistio = conteos.presente + conteos.tardanza + conteos.justificado;
  const porcentajeAsistencia = total ? Math.round((asistio / total) * 100) : null;

  return (
    <div className="flex flex-col gap-6 print:max-w-none">
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <Link href="/asistencia/alumno" className="text-sm text-brand-blue hover:underline">
            ← Reporte de asistencia por alumno
          </Link>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
            {estudiante.nombres} {estudiante.apellidos}
          </h1>
          <p className="font-mono-tab text-sm text-ink-soft">DNI {estudiante.dni}</p>
        </div>
        <ImprimirButton />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="surface-card p-4 text-center">
          <p className="text-2xl font-semibold text-ink">{total}</p>
          <p className="text-xs text-ink-soft">Clases registradas</p>
        </div>
        <div className="surface-card p-4 text-center">
          <p className="text-2xl font-semibold text-ok">{conteos.presente}</p>
          <p className="text-xs text-ink-soft">Presente</p>
        </div>
        <div className="surface-card p-4 text-center">
          <p className="text-2xl font-semibold text-warn">{conteos.tardanza}</p>
          <p className="text-xs text-ink-soft">Tardanza</p>
        </div>
        <div className="surface-card p-4 text-center">
          <p className="text-2xl font-semibold text-danger">{conteos.falta}</p>
          <p className="text-xs text-ink-soft">Falta</p>
        </div>
        <div className="surface-card p-4 text-center">
          <p className="text-2xl font-semibold text-ink">
            {porcentajeAsistencia === null ? "—" : `${porcentajeAsistencia}%`}
          </p>
          <p className="text-xs text-ink-soft">Asistencia</p>
        </div>
      </div>

      {cursosDelAlumno.length > 1 && (
        <form className="flex flex-wrap items-end gap-3 print:hidden">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Curso</span>
            <select
              name="curso_id"
              defaultValue={filtroCurso}
              className="w-64 rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
            >
              <option value="">Todos los cursos</option>
              {cursosDelAlumno.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:border-brand-blue hover:text-brand-blue"
          >
            Filtrar
          </button>
        </form>
      )}

      <div className="overflow-x-auto surface-card">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-soft">
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Curso</th>
              <th className="px-4 py-3 font-medium">Sede / grupo</th>
              <th className="px-4 py-3 font-medium">Modalidad</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-mono-tab text-ink-soft">{f.fecha}</td>
                <td className="px-4 py-3 font-medium text-ink">{f.asignaturaNombre}</td>
                <td className="px-4 py-3 text-ink-soft">
                  {f.grupoNombre ? `${f.sedeNombre} · ${f.grupoNombre}` : "—"}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {modalidadEtiqueta[f.modalidad] ?? f.modalidad}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${estadoEstilo[f.estado]}`}
                  >
                    {estadoTexto[f.estado]}
                  </span>
                </td>
              </tr>
            ))}
            {!filas.length && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-soft">
                  Este alumno todavía no tiene asistencia registrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
