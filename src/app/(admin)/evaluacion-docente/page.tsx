import Link from "next/link";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  preguntasEvalDocente,
  alternativasEvalDocente,
  evaluacionesDocente,
  cursos,
  grupos,
  sedes,
  asignaturas,
  usuarios,
} from "@/lib/db/schema";
import {
  crearPreguntaEvalDocente,
  crearAlternativaEvalDocente,
  cambiarEstadoEvaluacionDocente,
} from "@/lib/actions/evaluacion-docente";
import { evaluacionDocenteEstaActiva } from "@/lib/evaluacion-docente";

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

export default async function EvaluacionDocenteAdminPage() {
  const [listaPreguntas, cursosConConteo, activa] = await Promise.all([
    db
      .select()
      .from(preguntasEvalDocente)
      .where(eq(preguntasEvalDocente.activo, true))
      .orderBy(asc(preguntasEvalDocente.orden)),
    db
      .select({
        id: cursos.id,
        grupoNombre: grupos.nombre,
        modalidad: grupos.modalidad,
        sedeNombre: sedes.nombre,
        asignaturaNombre: asignaturas.nombre,
        docenteNombre: usuarios.nombreCompleto,
        recibidas: sql<number>`count(${evaluacionesDocente.id})`.mapWith(Number),
      })
      .from(cursos)
      .leftJoin(grupos, eq(grupos.id, cursos.grupoId))
      .leftJoin(sedes, eq(sedes.id, grupos.sedeId))
      .innerJoin(asignaturas, eq(asignaturas.id, cursos.asignaturaId))
      .innerJoin(usuarios, eq(usuarios.id, cursos.docenteId))
      .leftJoin(evaluacionesDocente, eq(evaluacionesDocente.cursoId, cursos.id))
      .where(eq(cursos.activo, true))
      .groupBy(
        cursos.id,
        grupos.nombre,
        grupos.modalidad,
        sedes.nombre,
        asignaturas.nombre,
        usuarios.nombreCompleto
      )
      .orderBy(asc(grupos.nombre), asc(asignaturas.nombre)),
    evaluacionDocenteEstaActiva(),
  ]);

  const preguntaIds = listaPreguntas.map((p) => p.id);
  const todasLasAlternativas = preguntaIds.length
    ? await db
        .select()
        .from(alternativasEvalDocente)
        .where(inArray(alternativasEvalDocente.preguntaId, preguntaIds))
        .orderBy(asc(alternativasEvalDocente.orden))
    : [];

  const alternativasPorPregunta = new Map<string, typeof todasLasAlternativas>();
  for (const a of todasLasAlternativas) {
    const arr = alternativasPorPregunta.get(a.preguntaId) ?? [];
    arr.push(a);
    alternativasPorPregunta.set(a.preguntaId, arr);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Evaluación a docente</h1>
        <p className="text-sm text-ink-soft">
          El cuestionario de abajo es único y se reutiliza para evaluar a
          cualquier docente, en cualquier curso. Los alumnos lo responden una
          vez por curso desde su portal.
        </p>
      </div>

      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 ${
          activa ? "border-ok/30 bg-ok-soft" : "border-line bg-surface"
        }`}
      >
        <div>
          <p className={`text-sm font-medium ${activa ? "text-ok" : "text-ink"}`}>
            {activa ? "Habilitada para los alumnos" : "Deshabilitada"}
          </p>
          <p className="text-xs text-ink-soft">
            {activa
              ? "Los alumnos ya pueden responder el cuestionario desde su portal."
              : "Los alumnos no ven la opción de evaluar hasta que la actives."}
          </p>
        </div>
        <form action={cambiarEstadoEvaluacionDocente}>
          <input type="hidden" name="activo" value={activa ? "false" : "true"} />
          <button
            type="submit"
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activa
                ? "border border-danger/30 text-danger hover:bg-danger-soft"
                : "bg-gradient-to-r from-brand-navy to-brand-blue text-white hover:shadow-lg hover:brightness-110"
            }`}
          >
            {activa ? "Deshabilitar" : "Habilitar"}
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-4">
        {listaPreguntas.map((p, i) => (
          <div key={p.id} className="surface-card p-5">
            <p className="mb-3 font-medium text-ink">
              {i + 1}. {p.enunciado}
            </p>
            <ul className="mb-3 flex flex-col gap-1.5">
              {(alternativasPorPregunta.get(p.id) ?? []).map((a) => (
                <li key={a.id} className="flex items-center gap-2 text-sm text-ink-soft">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-blue" />
                  {a.texto}
                </li>
              ))}
              {!(alternativasPorPregunta.get(p.id) ?? []).length && (
                <li className="text-xs italic text-ink-soft">
                  Sin alternativas todavía — agrega al menos 2 para que se pueda responder.
                </li>
              )}
            </ul>
            <form action={crearAlternativaEvalDocente} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="pregunta_id" value={p.id} />
              <input
                name="texto"
                required
                placeholder="Nueva alternativa (ej. Excelente)"
                className="flex-1 rounded-md border border-line bg-bg px-2 py-1.5 text-sm outline-none focus:border-brand-blue"
              />
              <button
                type="submit"
                className="rounded-md border border-line px-2.5 py-1.5 text-xs text-ink-soft hover:border-brand-blue hover:text-brand-blue"
              >
                Agregar
              </button>
            </form>
          </div>
        ))}
        {!listaPreguntas.length && (
          <p className="rounded-lg border border-line bg-surface px-4 py-6 text-center text-sm text-ink-soft">
            Todavía no hay preguntas en el cuestionario.
          </p>
        )}
      </div>

      <form
        action={crearPreguntaEvalDocente}
        className="flex flex-wrap items-end gap-3 surface-card p-5"
      >
        <label className="flex flex-1 flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Nueva pregunta</span>
          <input
            name="enunciado"
            required
            placeholder="Ej. ¿Cómo calificas la puntualidad del docente?"
            className="rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-gradient-to-r from-brand-navy to-brand-blue px-4 py-2 text-sm font-medium text-white hover:brightness-110 hover:shadow-lg transition-all duration-200"
        >
          Agregar pregunta
        </button>
      </form>

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-lg font-bold text-ink">Resultados por curso</h2>
        <div className="overflow-x-auto surface-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-soft">
                <th className="px-4 py-3 font-medium">Curso</th>
                <th className="px-4 py-3 font-medium">Docente</th>
                <th className="px-4 py-3 font-medium">Evaluaciones recibidas</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {cursosConConteo.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 text-ink-soft">
                    {c.grupoNombre ? (
                      <>
                        {c.sedeNombre} · {modalidadEtiqueta[c.modalidad ?? ""] ?? c.modalidad} ·{" "}
                        {c.grupoNombre} · <span className="font-medium text-ink">{c.asignaturaNombre}</span>
                      </>
                    ) : (
                      <>
                        <span className="italic">Sin grupo</span> ·{" "}
                        <span className="font-medium text-ink">{c.asignaturaNombre}</span>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{c.docenteNombre}</td>
                  <td className="px-4 py-3 font-mono-tab text-ink-soft">{c.recibidas}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/evaluacion-docente/${c.id}`}
                      className="text-xs font-medium text-brand-blue underline decoration-dotted hover:decoration-solid"
                    >
                      Ver resultados
                    </Link>
                  </td>
                </tr>
              ))}
              {!cursosConConteo.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-ink-soft">
                    Todavía no hay cursos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
