import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { grupos, sedes, cursos, asignaturas, usuarios, horarios } from "@/lib/db/schema";
import { listarDocentes } from "@/lib/docentes";
import { DIAS_SEMANA, diaSemanaTexto, formatearHora } from "@/lib/horarios";
import { crearHorario, eliminarHorario } from "@/lib/actions/horarios";
import { quitarCurso } from "../actions";
import { DocenteCursoSelect } from "./docente-curso-select";
import { AgregarCursoForm } from "./agregar-curso-form";

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

export default async function GrupoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [grupo] = await db
    .select({
      id: grupos.id,
      nombre: grupos.nombre,
      modalidad: grupos.modalidad,
      sedeId: grupos.sedeId,
      sedeNombre: sedes.nombre,
    })
    .from(grupos)
    .innerJoin(sedes, eq(sedes.id, grupos.sedeId))
    .where(eq(grupos.id, id))
    .limit(1);

  if (!grupo) notFound();

  const [listaCursos, listaAsignaturas, listaDocentes, listaHorarios] = await Promise.all([
    db
      .select({
        id: cursos.id,
        asignaturaNombre: asignaturas.nombre,
        docenteId: usuarios.id,
        docenteNombre: usuarios.nombreCompleto,
      })
      .from(cursos)
      .innerJoin(asignaturas, eq(asignaturas.id, cursos.asignaturaId))
      .innerJoin(usuarios, eq(usuarios.id, cursos.docenteId))
      .where(eq(cursos.grupoId, id))
      .orderBy(asc(asignaturas.nombre)),
    db
      .select()
      .from(asignaturas)
      .where(and(eq(asignaturas.activo, true), eq(asignaturas.sedeId, grupo.sedeId)))
      .orderBy(asc(asignaturas.nombre)),
    listarDocentes(grupo.sedeId),
    db
      .select({
        id: horarios.id,
        cursoId: horarios.cursoId,
        diaSemana: horarios.diaSemana,
        horaInicio: horarios.horaInicio,
        horaFin: horarios.horaFin,
      })
      .from(horarios)
      .where(eq(horarios.grupoId, id)),
  ]);

  const asignaturaPorCurso = new Map(listaCursos.map((c) => [c.id, c.asignaturaNombre]));
  const horarioOrdenado = [...listaHorarios].sort((a, b) =>
    a.diaSemana !== b.diaSemana ? a.diaSemana - b.diaSemana : a.horaInicio.localeCompare(b.horaInicio)
  );

  const asignaturasUsadas = new Set(listaCursos.map((c) => c.asignaturaNombre));
  const asignaturasDisponibles = listaAsignaturas.filter((a) => !asignaturasUsadas.has(a.nombre));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/grupos" className="text-sm text-brand-blue hover:underline">
          ← Grupos académicos
        </Link>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">{grupo.nombre}</h1>
        <p className="text-sm text-ink-soft">
          {grupo.sedeNombre} · {modalidadEtiqueta[grupo.modalidad] ?? grupo.modalidad}
        </p>
      </div>

      <div className="overflow-x-auto surface-card">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-soft">
              <th className="px-4 py-3 font-medium">Asignatura</th>
              <th className="px-4 py-3 font-medium">Docente</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {listaCursos.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{c.asignaturaNombre}</td>
                <td className="px-4 py-3">
                  <DocenteCursoSelect
                    cursoId={c.id}
                    grupoId={id}
                    docenteIdActual={c.docenteId}
                    docentes={
                      // Si el curso quedó con un docente de otra sede (asignado
                      // antes de este filtro), se sigue mostrando para no
                      // aparentar que tiene otro.
                      listaDocentes.some((d) => d.id === c.docenteId)
                        ? listaDocentes
                        : [...listaDocentes, { id: c.docenteId, nombreCompleto: `${c.docenteNombre} (otra sede)` }]
                    }
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/cursos/${c.id}/avance`}
                      className="text-xs font-medium text-brand-blue underline decoration-dotted hover:decoration-solid"
                    >
                      Ver avance
                    </Link>
                    <form action={quitarCurso}>
                      <input type="hidden" name="curso_id" value={c.id} />
                      <input type="hidden" name="grupo_id" value={id} />
                      <button
                        type="submit"
                        className="text-xs text-danger underline decoration-dotted hover:decoration-solid"
                      >
                        Quitar
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {!listaCursos.length && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-ink-soft">
                  Este grupo todavía no tiene asignaturas asignadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!listaDocentes.length && (
        <p className="rounded-lg border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
          {grupo.sedeNombre} todavía no tiene docentes asignados. Ve a{" "}
          <Link href="/roles" className="underline">
            Seguridad y roles
          </Link>{" "}
          para crear uno o asignarle esta sede.
        </p>
      )}

      {!listaAsignaturas.length && (
        <p className="rounded-lg border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
          {grupo.sedeNombre} todavía no tiene asignaturas registradas. Ve a{" "}
          <Link href="/sedes" className="underline">
            Asignaturas
          </Link>{" "}
          para crear una en esta sede.
        </p>
      )}

      {!!asignaturasDisponibles.length && !!listaDocentes.length && (
        <AgregarCursoForm
          grupoId={id}
          asignaturas={asignaturasDisponibles.map((a) => ({
            id: a.id,
            nombre: a.nombre,
            docenteId: a.docenteId,
          }))}
          docentes={listaDocentes}
        />
      )}

      <div className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-bold text-ink">Horario del grupo</h2>

        <div className="overflow-x-auto surface-card">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-soft">
                <th className="px-4 py-3 font-medium">Día</th>
                <th className="px-4 py-3 font-medium">Horario</th>
                <th className="px-4 py-3 font-medium">Asignatura</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {horarioOrdenado.map((h) => (
                <tr key={h.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{diaSemanaTexto[h.diaSemana]}</td>
                  <td className="px-4 py-3 font-mono-tab text-ink-soft">
                    {formatearHora(h.horaInicio)} – {formatearHora(h.horaFin)}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {h.cursoId ? asignaturaPorCurso.get(h.cursoId) ?? "—" : <span className="italic">General</span>}
                  </td>
                  <td className="px-4 py-3">
                    <form action={eliminarHorario}>
                      <input type="hidden" name="id" value={h.id} />
                      <button
                        type="submit"
                        className="text-xs text-danger underline decoration-dotted hover:decoration-solid"
                      >
                        Quitar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {!horarioOrdenado.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-ink-soft">
                    Este grupo todavía no tiene horario registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <form
          action={crearHorario}
          className="flex flex-wrap items-end gap-3 surface-card p-5"
        >
          <input type="hidden" name="grupo_id" value={id} />
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Día</span>
            <select
              name="dia_semana"
              required
              defaultValue=""
              className="rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
            >
              <option value="" disabled>
                Selecciona…
              </option>
              {DIAS_SEMANA.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Hora inicio</span>
            <input
              type="time"
              name="hora_inicio"
              required
              className="rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Hora fin</span>
            <input
              type="time"
              name="hora_fin"
              required
              className="rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Asignatura (opcional)</span>
            <select
              name="curso_id"
              defaultValue=""
              className="rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
            >
              <option value="">General (sin asignatura)</option>
              {listaCursos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.asignaturaNombre}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-md bg-gradient-to-r from-brand-navy to-brand-blue px-4 py-2 text-sm font-medium text-white hover:brightness-110 hover:shadow-lg transition-all duration-200"
          >
            Agregar horario
          </button>
        </form>
      </div>
    </div>
  );
}
