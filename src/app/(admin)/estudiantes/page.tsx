import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matriculas, estudiantes, grupos, sedes } from "@/lib/db/schema";
import { calcularEstado } from "@/lib/vigencia";
import { marcarRetirada, renovarMatricula } from "../vigencia/actions";

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

export default async function EstudiantesPage() {
  const filasCrudas = await db
    .select({
      matriculaId: matriculas.id,
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
    .orderBy(desc(matriculas.fechaIngreso));

  // Nos quedamos con la matrícula más reciente de cada estudiante.
  const porEstudiante = new Map<string, (typeof filasCrudas)[number]>();
  for (const f of filasCrudas) {
    if (!porEstudiante.has(f.estudianteId)) porEstudiante.set(f.estudianteId, f);
  }
  const filas = [...porEstudiante.values()];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Estudiantes y matrículas</h1>
          <p className="text-sm text-ink-soft">
            Toda matrícula dura 1 mes desde la fecha de ingreso; se avisa 5 días
            antes de vencer.
          </p>
        </div>
        <Link
          href="/estudiantes/nuevo"
          className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue"
        >
          Matricular estudiante
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[720px] text-sm">
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
            {filas.map((f) => {
              const estado = calcularEstado(f.fechaFin, f.retirada);
              return (
                <tr key={f.matriculaId} className="border-b border-line last:border-0">
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
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${estadoEstilo[estado]}`}
                    >
                      {estadoTexto[estado]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
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
                      {estado !== "retirada" && (
                        <form action={marcarRetirada}>
                          <input type="hidden" name="id" value={f.matriculaId} />
                          <button
                            type="submit"
                            className="text-xs text-danger underline decoration-dotted hover:decoration-solid"
                          >
                            Marcar retiro
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!filas.length && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink-soft">
                  Todavía no hay estudiantes matriculados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
