import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { asistencias, cursos, asignaturas } from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";

const estadoEstilo: Record<string, string> = {
  presente: "bg-ok-soft text-ok",
  tardanza: "bg-warn-soft text-warn",
  falta: "bg-danger-soft text-danger",
  justificado: "bg-line text-ink-soft",
};

export default async function AsistenciaPortalPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario?.estudianteId) redirect("/login");

  const filas = await db
    .select({
      fecha: asistencias.fecha,
      modalidad: asistencias.modalidad,
      estado: asistencias.estado,
      asignaturaNombre: asignaturas.nombre,
    })
    .from(asistencias)
    .innerJoin(cursos, eq(cursos.id, asistencias.cursoId))
    .innerJoin(asignaturas, eq(asignaturas.id, cursos.asignaturaId))
    .where(eq(asistencias.estudianteId, usuario.estudianteId))
    .orderBy(desc(asistencias.fecha));

  const total = filas.length;
  const presentes = filas.filter((a) => a.estado === "presente" || a.estado === "tardanza").length;
  const porcentaje = total ? Math.round((presentes / total) * 100) : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Mi asistencia</h1>
        {porcentaje !== null && (
          <p className="text-sm text-ink-soft">
            Asistencia: <span className="font-mono-tab font-medium text-ink">{porcentaje}%</span>{" "}
            ({presentes}/{total} clases)
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-soft">
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Materia</th>
              <th className="px-4 py-3 font-medium">Modalidad</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((a, i) => (
              <tr key={i} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-mono-tab text-ink-soft">{a.fecha}</td>
                <td className="px-4 py-3 text-ink">{a.asignaturaNombre}</td>
                <td className="px-4 py-3 text-ink-soft capitalize">{a.modalidad}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${estadoEstilo[a.estado]}`}
                  >
                    {a.estado}
                  </span>
                </td>
              </tr>
            ))}
            {!filas.length && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-soft">
                  Todavía no hay registros de asistencia.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
