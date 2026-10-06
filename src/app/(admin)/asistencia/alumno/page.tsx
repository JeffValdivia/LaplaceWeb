import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { estudiantes } from "@/lib/db/schema";

export default async function AsistenciaAlumnoBuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  const listaEstudiantes = await db
    .select({
      id: estudiantes.id,
      dni: estudiantes.dni,
      nombres: estudiantes.nombres,
      apellidos: estudiantes.apellidos,
    })
    .from(estudiantes)
    .orderBy(asc(estudiantes.apellidos));

  const filtrados = q
    ? listaEstudiantes.filter((e) => {
        const texto = q.toLowerCase();
        return (
          `${e.nombres} ${e.apellidos}`.toLowerCase().includes(texto) || e.dni.includes(texto)
        );
      })
    : listaEstudiantes;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
          Reporte de asistencia por alumno
        </h1>
        <p className="text-sm text-ink-soft">
          Busca un alumno para ver su historial de asistencia completo, en
          todos sus cursos.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3 surface-card p-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Buscar</span>
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Nombre, apellido o DNI…"
            className="w-72 rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-gradient-to-r from-brand-navy to-brand-blue px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:shadow-lg hover:brightness-110"
        >
          Buscar
        </button>
      </form>

      <div className="overflow-x-auto surface-card">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-soft">
              <th className="px-4 py-3 font-medium">DNI</th>
              <th className="px-4 py-3 font-medium">Estudiante</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((e) => (
              <tr key={e.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-mono-tab text-ink-soft">{e.dni}</td>
                <td className="px-4 py-3 font-medium text-ink">
                  {e.nombres} {e.apellidos}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/asistencia/alumno/${e.id}`}
                    className="text-xs font-medium text-brand-blue underline decoration-dotted hover:decoration-solid"
                  >
                    Ver asistencia
                  </Link>
                </td>
              </tr>
            ))}
            {!filtrados.length && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-ink-soft">
                  No hay alumnos con esos datos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
