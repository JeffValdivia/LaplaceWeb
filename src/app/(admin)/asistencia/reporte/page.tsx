import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, and, eq, gte, lte, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  cursos,
  grupos,
  sedes,
  asignaturas,
  usuarios,
  matriculas,
  estudiantes,
  asistencias,
} from "@/lib/db/schema";
import { calcularEstado } from "@/lib/vigencia";
import {
  AsistenciaMensualPreview,
  type AlumnoAsistenciaMensual,
  type EstadoAsistencia,
} from "@/components/asistencia-mensual-preview";
import { ImprimirButton } from "@/components/imprimir-button";

function mesActual() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
}

export default async function ReporteAsistenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const cursoId = typeof params.curso_id === "string" ? params.curso_id : "";
  const mes = typeof params.mes === "string" && /^\d{4}-\d{2}$/.test(params.mes) ? params.mes : mesActual();

  const [curso] = await db
    .select({
      id: cursos.id,
      grupoId: cursos.grupoId,
      grupoNombre: grupos.nombre,
      sedeNombre: sedes.nombre,
      asignaturaNombre: asignaturas.nombre,
      docenteNombre: usuarios.nombreCompleto,
    })
    .from(cursos)
    .leftJoin(grupos, eq(grupos.id, cursos.grupoId))
    .leftJoin(sedes, eq(sedes.id, grupos.sedeId))
    .innerJoin(asignaturas, eq(asignaturas.id, cursos.asignaturaId))
    .innerJoin(usuarios, eq(usuarios.id, cursos.docenteId))
    .where(eq(cursos.id, cursoId))
    .limit(1);

  if (!curso || !curso.grupoId) notFound();

  const [year, month] = mes.split("-").map(Number);
  const diasEnMes = new Date(year, month, 0).getDate();
  const dias = Array.from({ length: diasEnMes }, (_, i) => i + 1);
  const desde = `${mes}-01`;
  const hasta = `${mes}-${String(diasEnMes).padStart(2, "0")}`;
  const mesLabel = new Date(year, month - 1, 1).toLocaleDateString("es-PE", {
    month: "long",
    year: "numeric",
  });

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
    .where(eq(matriculas.grupoId, curso.grupoId))
    .orderBy(asc(estudiantes.apellidos));

  const masRecientePorEstudiante = new Map<string, (typeof matriculasCrudas)[number]>();
  for (const m of matriculasCrudas) {
    const actual = masRecientePorEstudiante.get(m.estudianteId);
    if (!actual || m.fechaIngreso > actual.fechaIngreso) {
      masRecientePorEstudiante.set(m.estudianteId, m);
    }
  }

  const roster = [...masRecientePorEstudiante.values()]
    .filter((m) => {
      const estado = calcularEstado(m.fechaFin, m.retirada);
      return estado === "activa" || estado === "por_vencer";
    })
    .sort((a, b) => `${a.apellidos} ${a.nombres}`.localeCompare(`${b.apellidos} ${b.nombres}`));

  const asistenciasDelMes = roster.length
    ? await db
        .select({
          estudianteId: asistencias.estudianteId,
          fecha: asistencias.fecha,
          estado: asistencias.estado,
        })
        .from(asistencias)
        .where(
          and(
            eq(asistencias.cursoId, cursoId),
            gte(asistencias.fecha, desde),
            lte(asistencias.fecha, hasta),
            inArray(
              asistencias.estudianteId,
              roster.map((r) => r.estudianteId)
            )
          )
        )
    : [];

  const porAlumno = new Map<string, Partial<Record<number, EstadoAsistencia>>>();
  for (const a of asistenciasDelMes) {
    const dia = Number(a.fecha.slice(8, 10));
    const mapa = porAlumno.get(a.estudianteId) ?? {};
    mapa[dia] = a.estado as EstadoAsistencia;
    porAlumno.set(a.estudianteId, mapa);
  }

  const alumnos: AlumnoAsistenciaMensual[] = roster.map((r) => ({
    id: r.estudianteId,
    dni: r.dni,
    nombres: r.nombres,
    apellidos: r.apellidos,
    porDia: porAlumno.get(r.estudianteId) ?? {},
  }));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 print:max-w-none">
      <style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <Link
          href={`/asistencia?curso_id=${cursoId}`}
          className="text-sm text-brand-blue hover:underline"
        >
          ← Volver a asistencia
        </Link>
        <form className="flex items-end gap-3">
          <input type="hidden" name="curso_id" value={cursoId} />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Mes</span>
            <input
              type="month"
              name="mes"
              defaultValue={mes}
              className="rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
            />
          </label>
          <button
            type="submit"
            className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink hover:border-brand-blue hover:text-brand-blue"
          >
            Ver mes
          </button>
        </form>
        <ImprimirButton />
      </div>

      <AsistenciaMensualPreview
        sedeNombre={curso.sedeNombre ?? "—"}
        grupoNombre={curso.grupoNombre ?? "—"}
        asignaturaNombre={curso.asignaturaNombre}
        docenteNombre={curso.docenteNombre}
        mesLabel={mesLabel}
        dias={dias}
        alumnos={alumnos}
      />
    </div>
  );
}
