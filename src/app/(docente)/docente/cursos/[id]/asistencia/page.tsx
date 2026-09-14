import { notFound, redirect } from "next/navigation";
import { asc, and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { matriculas, estudiantes, asistencias, cursos } from "@/lib/db/schema";
import { calcularEstado } from "@/lib/vigencia";
import { guardarAsistencia } from "@/lib/actions/asistencia";
import { obtenerUsuarioActual } from "@/lib/auth/session";

const hoy = new Date().toISOString().slice(0, 10);

export default async function AsistenciaDocentePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");

  const { id: cursoId } = await params;
  const sp = await searchParams;
  const fecha = typeof sp.fecha === "string" ? sp.fecha : hoy;
  const modalidad = typeof sp.modalidad === "string" ? sp.modalidad : "presencial";

  const [curso] = await db
    .select({ id: cursos.id, grupoId: cursos.grupoId })
    .from(cursos)
    .where(and(eq(cursos.id, cursoId), eq(cursos.docenteId, usuario.id)))
    .limit(1);
  if (!curso) notFound();

  const matriculados = await db
    .select({
      estudianteId: estudiantes.id,
      dni: estudiantes.dni,
      nombres: estudiantes.nombres,
      apellidos: estudiantes.apellidos,
      fechaFin: matriculas.fechaFin,
      retirada: matriculas.retirada,
    })
    .from(matriculas)
    .innerJoin(estudiantes, eq(estudiantes.id, matriculas.estudianteId))
    .where(eq(matriculas.grupoId, curso.grupoId))
    .orderBy(asc(estudiantes.apellidos));

  const roster = matriculados.filter((m) => {
    const estado = calcularEstado(m.fechaFin, m.retirada);
    return estado === "activa" || estado === "por_vencer";
  });

  let existentes: Record<string, string> = {};
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Asistencia</h1>
        <p className="text-sm text-ink-soft">Elige fecha y modalidad, y guarda.</p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface p-4">
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
          className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue"
        >
          Cargar lista
        </button>
      </form>

      <form
        action={guardarAsistencia}
        className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5"
      >
        <input type="hidden" name="curso_id" value={cursoId} />
        <input type="hidden" name="fecha" value={fecha} />
        <input type="hidden" name="modalidad" value={modalidad} />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
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
                    No hay matriculados activos en este grupo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!!roster.length && (
          <button
            type="submit"
            className="self-start rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue"
          >
            Guardar asistencia
          </button>
        )}
      </form>
    </div>
  );
}
