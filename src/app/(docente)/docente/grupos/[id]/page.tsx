import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { asc, and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { grupos, sedes, matriculas, estudiantes, cursos, asignaturas, horarios } from "@/lib/db/schema";
import { calcularEstado } from "@/lib/vigencia";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { diaSemanaTexto, formatearHora } from "@/lib/horarios";

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

const estadoEstilo: Record<string, string> = {
  activa: "bg-ok-soft text-ok",
  por_vencer: "bg-warn-soft text-warn",
  vencida: "bg-danger-soft text-danger",
  retirada: "bg-line text-ink-soft",
};

const estadoTexto: Record<string, string> = {
  activa: "Activa",
  por_vencer: "Por vencer",
  vencida: "Vencida",
  retirada: "Retirada",
};

export default async function GrupoDocentePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");

  const { id } = await params;

  const [grupo] = await db
    .select({
      id: grupos.id,
      nombre: grupos.nombre,
      modalidad: grupos.modalidad,
      sedeNombre: sedes.nombre,
    })
    .from(grupos)
    .innerJoin(sedes, eq(sedes.id, grupos.sedeId))
    .where(eq(grupos.id, id))
    .limit(1);

  if (!grupo) notFound();

  const cursosDelDocente = await db
    .select({ id: cursos.id, asignaturaNombre: asignaturas.nombre })
    .from(cursos)
    .innerJoin(asignaturas, eq(asignaturas.id, cursos.asignaturaId))
    .where(and(eq(cursos.grupoId, id), eq(cursos.docenteId, usuario.id)))
    .orderBy(asc(asignaturas.nombre));

  if (!cursosDelDocente.length) notFound();

  const cursoIdsDelDocente = new Set(cursosDelDocente.map((c) => c.id));
  const asignaturaPorCurso = new Map(cursosDelDocente.map((c) => [c.id, c.asignaturaNombre]));

  const horarioGrupo = (
    await db
      .select({
        id: horarios.id,
        cursoId: horarios.cursoId,
        diaSemana: horarios.diaSemana,
        horaInicio: horarios.horaInicio,
        horaFin: horarios.horaFin,
      })
      .from(horarios)
      .where(eq(horarios.grupoId, id))
  )
    .filter((h) => !h.cursoId || cursoIdsDelDocente.has(h.cursoId))
    .sort((a, b) =>
      a.diaSemana !== b.diaSemana ? a.diaSemana - b.diaSemana : a.horaInicio.localeCompare(b.horaInicio)
    );

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
    .where(eq(matriculas.grupoId, id))
    .orderBy(asc(estudiantes.apellidos));

  // Un estudiante puede tener varias matrículas en el mismo grupo (por
  // renovaciones) — solo la más reciente cuenta, igual que en "Estudiantes y
  // matrículas" y "Vigencia de matrícula". Si no se dedupea aquí, aparece
  // repetido en la lista del docente.
  const masRecientePorEstudiante = new Map<string, (typeof matriculasCrudas)[number]>();
  for (const m of matriculasCrudas) {
    const actual = masRecientePorEstudiante.get(m.estudianteId);
    if (!actual || m.fechaIngreso > actual.fechaIngreso) {
      masRecientePorEstudiante.set(m.estudianteId, m);
    }
  }
  const matriculados = [...masRecientePorEstudiante.values()]
    .map((m) => ({ ...m, estado: calcularEstado(m.fechaFin, m.retirada) }))
    .filter((m) => m.estado === "activa" || m.estado === "por_vencer")
    .sort((a, b) => a.apellidos.localeCompare(b.apellidos));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/docente" className="text-sm text-brand-blue hover:underline">
          ← Mis grupos
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-ink">{grupo.nombre}</h1>
        <p className="text-sm text-ink-soft">
          {grupo.sedeNombre} · {modalidadEtiqueta[grupo.modalidad] ?? grupo.modalidad} ·{" "}
          {matriculados.length} estudiante{matriculados.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cursosDelDocente.map((c) => (
          <Link
            key={c.id}
            href={`/docente/cursos/${c.id}`}
            className="rounded-lg border border-line bg-surface p-4 text-center font-medium text-ink transition hover:border-brand-blue hover:text-brand-blue"
          >
            {c.asignaturaNombre}
          </Link>
        ))}
        <Link
          href={`/docente/grupos/${id}/comunicados`}
          className="rounded-lg border border-line bg-surface p-4 text-center font-medium text-ink transition hover:border-brand-blue hover:text-brand-blue"
        >
          Comunicados
        </Link>
      </div>

      {!!horarioGrupo.length && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-soft">Horario</h2>
          <div className="flex flex-wrap gap-2">
            {horarioGrupo.map((h) => (
              <span
                key={h.id}
                className="rounded-md border border-line bg-surface px-3 py-1.5 text-xs text-ink"
              >
                <span className="font-medium">{diaSemanaTexto[h.diaSemana]}</span>{" "}
                {formatearHora(h.horaInicio)}–{formatearHora(h.horaFin)}
                {h.cursoId && (
                  <span className="text-ink-soft"> · {asignaturaPorCurso.get(h.cursoId)}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-soft">
              <th className="px-4 py-3 font-medium">DNI</th>
              <th className="px-4 py-3 font-medium">Estudiante</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {matriculados.map((m) => (
              <tr key={m.estudianteId} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-mono-tab text-ink-soft">{m.dni}</td>
                <td className="px-4 py-3 text-ink">
                  {m.nombres} {m.apellidos}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${estadoEstilo[m.estado]}`}
                  >
                    {estadoTexto[m.estado]}
                  </span>
                </td>
              </tr>
            ))}
            {!matriculados.length && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-ink-soft">
                  Sin estudiantes matriculados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
