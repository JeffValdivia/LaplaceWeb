import { MembreteAcademia } from "./membrete-academia";

export type EstadoAsistencia = "presente" | "tardanza" | "falta" | "justificado";

export type AlumnoAsistenciaMensual = {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  porDia: Partial<Record<number, EstadoAsistencia>>;
};

const estiloCelda: Record<EstadoAsistencia, string> = {
  presente: "bg-ok text-white",
  falta: "bg-danger text-white",
  tardanza: "bg-warn-soft text-warn",
  justificado: "bg-brand-blue-light text-brand-navy",
};

const letraCelda: Record<EstadoAsistencia, string> = {
  presente: "P",
  falta: "F",
  tardanza: "T",
  justificado: "J",
};

export function AsistenciaMensualPreview({
  sedeNombre,
  grupoNombre,
  asignaturaNombre,
  docenteNombre,
  mesLabel,
  dias,
  alumnos,
}: {
  sedeNombre: string;
  grupoNombre: string;
  asignaturaNombre: string;
  docenteNombre: string;
  mesLabel: string;
  dias: number[];
  alumnos: AlumnoAsistenciaMensual[];
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-6 print:rounded-none print:border-0 print:p-0">
      <MembreteAcademia subtitulo="Reporte mensual de asistencia" />

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <p>
          <span className="font-medium text-ink">Sede:</span>{" "}
          <span className="text-ink-soft">{sedeNombre}</span>
        </p>
        <p>
          <span className="font-medium text-ink">Mes:</span>{" "}
          <span className="text-ink-soft capitalize">{mesLabel}</span>
        </p>
        <p>
          <span className="font-medium text-ink">Grupo:</span>{" "}
          <span className="text-ink-soft">{grupoNombre}</span>
        </p>
        <p>
          <span className="font-medium text-ink">Curso:</span>{" "}
          <span className="text-ink-soft">
            {asignaturaNombre} ({docenteNombre})
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-ok" /> Presente (P)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-warn-soft" /> Tardanza (T)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-danger" /> Falta (F)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-brand-blue-light" /> Justificado (J)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[0.65rem] leading-none">
          <thead>
            <tr className="border-b-2 border-ink text-left">
              <th className="whitespace-nowrap px-2 py-2 font-semibold text-ink">N°</th>
              <th className="min-w-[150px] whitespace-nowrap px-2 py-2 font-semibold text-ink">
                Apellidos y nombres
              </th>
              {dias.map((d) => (
                <th
                  key={d}
                  className="w-5 border-l border-line px-0 py-2 text-center font-semibold text-ink"
                >
                  {d}
                </th>
              ))}
              <th className="border-l-2 border-ink px-1.5 py-2 text-center font-semibold text-ok">P</th>
              <th className="px-1.5 py-2 text-center font-semibold text-warn">T</th>
              <th className="px-1.5 py-2 text-center font-semibold text-danger">F</th>
              <th className="px-1.5 py-2 text-center font-semibold text-brand-navy">J</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((a, i) => {
              const conteo: Record<EstadoAsistencia, number> = {
                presente: 0,
                tardanza: 0,
                falta: 0,
                justificado: 0,
              };
              for (const d of dias) {
                const e = a.porDia[d];
                if (e) conteo[e]++;
              }
              return (
                <tr key={a.id} className="border-b border-line">
                  <td className="px-2 py-1 font-mono-tab text-ink-soft">{i + 1}</td>
                  <td className="whitespace-nowrap px-2 py-1 text-ink">
                    {a.apellidos} {a.nombres}
                  </td>
                  {dias.map((d) => {
                    const e = a.porDia[d];
                    return (
                      <td
                        key={d}
                        className={`border-l border-line text-center font-semibold ${
                          e ? estiloCelda[e] : ""
                        }`}
                      >
                        {e ? letraCelda[e] : ""}
                      </td>
                    );
                  })}
                  <td className="border-l-2 border-ink text-center text-ok">
                    {conteo.presente || ""}
                  </td>
                  <td className="text-center text-warn">{conteo.tardanza || ""}</td>
                  <td className="text-center text-danger">{conteo.falta || ""}</td>
                  <td className="text-center text-brand-navy">{conteo.justificado || ""}</td>
                </tr>
              );
            })}
            {!alumnos.length && (
              <tr>
                <td colSpan={dias.length + 6} className="py-6 text-center text-xs text-ink-soft">
                  Sin alumnos matriculados vigentes en este curso.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
