import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matriculas, estudiantes, grupos, sedes } from "@/lib/db/schema";
import { calcularEstado } from "@/lib/vigencia";
import { marcarRetirada, renovarMatricula } from "./actions";
import { FiltrosVigencia } from "./filtros";
import { EditarEstudianteModal } from "./editar-estudiante-modal";
import { RestablecerPasswordButton } from "./restablecer-password-button";

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
  const filtroGrupo = typeof params.grupo === "string" ? params.grupo : "";
  const filtroTexto = typeof params.q === "string" ? params.q.trim() : "";
  const verHistorial = params.historial === "1";

  const [listaSedes, listaGrupos, filasCrudas] = await Promise.all([
    db.select().from(sedes).orderBy(asc(sedes.nombre)),
    db
      .select({ id: grupos.id, nombre: grupos.nombre, sedeId: grupos.sedeId })
      .from(grupos)
      .orderBy(asc(grupos.nombre)),
    db
      .select({
        id: matriculas.id,
        estudianteId: matriculas.estudianteId,
        dni: estudiantes.dni,
        nombres: estudiantes.nombres,
        apellidos: estudiantes.apellidos,
        fechaNacimiento: estudiantes.fechaNacimiento,
        telefono: estudiantes.telefono,
        email: estudiantes.email,
        apoderadoNombre: estudiantes.apoderadoNombre,
        apoderadoTelefono: estudiantes.apoderadoTelefono,
        fechaIngreso: matriculas.fechaIngreso,
        fechaFin: matriculas.fechaFin,
        retirada: matriculas.retirada,
        grupoId: grupos.id,
        grupoNombre: grupos.nombre,
        modalidad: grupos.modalidad,
        sedeNombre: sedes.nombre,
      })
      .from(matriculas)
      .innerJoin(estudiantes, eq(estudiantes.id, matriculas.estudianteId))
      .leftJoin(grupos, eq(grupos.id, matriculas.grupoId))
      .leftJoin(sedes, eq(sedes.id, grupos.sedeId))
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
    .filter((f) => !filtroGrupo || f.grupoId === filtroGrupo)
    .filter((f) => {
      if (!filtroTexto) return true;
      const texto = filtroTexto.toLowerCase();
      return `${f.nombres} ${f.apellidos}`.toLowerCase().includes(texto);
    });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
          Control de vigencia de matrícula
        </h1>
        <p className="text-sm text-ink-soft">
          Por defecto solo se muestra la matrícula vigente de cada estudiante.
          Las matrículas antiguas ya renovadas no tienen acciones — la acción
          se hace sobre la vigente.
        </p>
      </div>

      <FiltrosVigencia
        sedes={listaSedes.map((s) => ({ id: s.id, nombre: s.nombre }))}
        grupos={listaGrupos}
        estadoInicial={filtroEstado}
        sedeInicial={filtroSede}
        grupoInicial={filtroGrupo}
        textoInicial={filtroTexto}
        historialInicial={verHistorial}
        filas={filas}
      />

      <div className="overflow-x-auto surface-card">
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
                  {f.grupoNombre ? (
                    <>
                      {f.sedeNombre} · {modalidadEtiqueta[f.modalidad ?? ""] ?? f.modalidad} ·{" "}
                      {f.grupoNombre}
                    </>
                  ) : (
                    <span className="italic text-ink-soft">Sin grupo</span>
                  )}
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
                  <div className="flex flex-wrap items-center gap-3">
                    {f.esMasReciente ? (
                      <>
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
                      </>
                    ) : (
                      <span className="text-xs italic text-ink-soft">Ya renovada</span>
                    )}
                    <EditarEstudianteModal
                      estudiante={{
                        id: f.estudianteId,
                        dni: f.dni,
                        nombres: f.nombres,
                        apellidos: f.apellidos,
                        fechaNacimiento: f.fechaNacimiento,
                        telefono: f.telefono,
                        email: f.email,
                        apoderadoNombre: f.apoderadoNombre,
                        apoderadoTelefono: f.apoderadoTelefono,
                      }}
                    />
                    <RestablecerPasswordButton estudianteId={f.estudianteId} />
                  </div>
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
