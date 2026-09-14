import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matriculas, estudiantes, grupos, sedes } from "@/lib/db/schema";
import { calcularEstado } from "@/lib/vigencia";
import { marcarRetirada, renovarMatricula } from "./actions";
import { ExportarCsvButton } from "./export-button";

const estadoEstilo: Record<string, string> = {
  activa: "bg-ok-soft text-ok",
  por_vencer: "bg-warn-soft text-warn",
  vencida: "bg-danger-soft text-danger",
  retirada: "bg-line text-ink-soft",
};

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

const estadoTexto: Record<string, string> = {
  activa: "Activa",
  por_vencer: "Por vencer",
  vencida: "Vencida",
  retirada: "Retirada",
};

export default async function VigenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const filtroEstado = typeof params.estado === "string" ? params.estado : "";
  const filtroSede = typeof params.sede === "string" ? params.sede : "";
  const filtroModalidad = typeof params.modalidad === "string" ? params.modalidad : "";
  const verHistorial = params.historial === "1";

  const [listaSedes, filasCrudas] = await Promise.all([
    db.select().from(sedes).orderBy(asc(sedes.nombre)),
    db
      .select({
        id: matriculas.id,
        estudianteId: matriculas.estudianteId,
        dni: estudiantes.dni,
        nombres: estudiantes.nombres,
        apellidos: estudiantes.apellidos,
        fechaIngreso: matriculas.fechaIngreso,
        fechaFin: matriculas.fechaFin,
        retirada: matriculas.retirada,
        grupoNombre: grupos.nombre,
        modalidad: grupos.modalidad,
        sedeNombre: sedes.nombre,
      })
      .from(matriculas)
      .innerJoin(estudiantes, eq(estudiantes.id, matriculas.estudianteId))
      .innerJoin(grupos, eq(grupos.id, matriculas.grupoId))
      .innerJoin(sedes, eq(sedes.id, grupos.sedeId))
      .orderBy(desc(matriculas.fechaFin)),
  ]);

  const masRecientePorEstudiante = new Map<string, { id: string; fechaIngreso: string }>();
  for (const f of filasCrudas) {
    const actual = masRecientePorEstudiante.get(f.estudianteId);
    if (!actual || f.fechaIngreso > actual.fechaIngreso) {
      masRecientePorEstudiante.set(f.estudianteId, { id: f.id, fechaIngreso: f.fechaIngreso });
    }
  }

  const filas = filasCrudas
    .map((f) => ({
      ...f,
      estado: calcularEstado(f.fechaFin, f.retirada),
      esMasReciente: masRecientePorEstudiante.get(f.estudianteId)?.id === f.id,
    }))
    .filter((f) => verHistorial || f.esMasReciente)
    .filter((f) => !filtroEstado || f.estado === filtroEstado)
    .filter((f) => !filtroSede || f.sedeNombre === filtroSede)
    .filter((f) => !filtroModalidad || f.modalidad === filtroModalidad);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">
          Control de vigencia de matrícula
        </h1>
        <p className="text-sm text-ink-soft">
          Por defecto solo se muestra la matrícula vigente de cada estudiante.
          Las matrículas antiguas ya renovadas no tienen acciones — la acción
          se hace sobre la vigente.
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface p-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Estado</span>
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
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Sede</span>
          <select
            name="sede"
            defaultValue={filtroSede}
            className="rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
          >
            <option value="">Todas</option>
            {listaSedes.map((s) => (
              <option key={s.id} value={s.nombre}>
                {s.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-ink">Modalidad</span>
          <select
            name="modalidad"
            defaultValue={filtroModalidad}
            className="rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue"
          >
            <option value="">Todas</option>
            <option value="presencial">Presencial</option>
            <option value="virtual">Virtual</option>
          </select>
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-soft">
          <input type="checkbox" name="historial" value="1" defaultChecked={verHistorial} />
          Mostrar historial (matrículas ya renovadas)
        </label>
        <button
          type="submit"
          className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue"
        >
          Filtrar
        </button>
        <div className="ml-auto">
          <ExportarCsvButton filas={filas} />
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-soft">
              <th className="px-4 py-3 font-medium">DNI</th>
              <th className="px-4 py-3 font-medium">Estudiante</th>
              <th className="px-4 py-3 font-medium">Grupo</th>
              <th className="px-4 py-3 font-medium">Ingreso</th>
              <th className="px-4 py-3 font-medium">Vence</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-mono-tab text-ink-soft">{f.dni}</td>
                <td className="px-4 py-3 font-medium text-ink">
                  {f.nombres} {f.apellidos}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {f.sedeNombre} · {modalidadEtiqueta[f.modalidad] ?? f.modalidad} · {f.grupoNombre}
                </td>
                <td className="px-4 py-3 font-mono-tab text-ink-soft">{f.fechaIngreso}</td>
                <td className="px-4 py-3 font-mono-tab text-ink-soft">{f.fechaFin}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${estadoEstilo[f.estado]}`}
                  >
                    {estadoTexto[f.estado]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {f.esMasReciente ? (
                    <div className="flex items-center gap-3">
                      <form action={renovarMatricula}>
                        <input type="hidden" name="estudiante_id" value={f.estudianteId} />
                        <button
                          type="submit"
                          className="text-xs font-medium text-brand-blue underline decoration-dotted hover:decoration-solid"
                        >
                          Renovar
                        </button>
                      </form>
                      {f.estado !== "retirada" && (
                        <form action={marcarRetirada}>
                          <input type="hidden" name="id" value={f.id} />
                          <button
                            type="submit"
                            className="text-xs text-danger underline decoration-dotted hover:decoration-solid"
                          >
                            Marcar retiro
                          </button>
                        </form>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs italic text-ink-soft">Ya renovada</span>
                  )}
                </td>
              </tr>
            ))}
            {!filas.length && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink-soft">
                  No hay matrículas con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
