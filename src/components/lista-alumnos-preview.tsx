import { MembreteAcademia } from "./membrete-academia";

export type AlumnoLista = { id: string; dni: string; nombres: string; apellidos: string };

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

export function ListaAlumnosPreview({
  sedeNombre,
  grupoNombre,
  modalidad,
  alumnos,
  fechaGeneracion,
}: {
  sedeNombre: string;
  grupoNombre: string;
  modalidad: string;
  alumnos: AlumnoLista[];
  fechaGeneracion: string;
}) {
  return (
    <div className="flex flex-col gap-6 rounded-lg border border-line bg-surface p-8 print:rounded-none print:border-0 print:p-0">
      <MembreteAcademia subtitulo="Lista de alumnos matriculados" />

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
        <p>
          <span className="font-medium text-ink">Sede:</span>{" "}
          <span className="text-ink-soft">{sedeNombre}</span>
        </p>
        <p>
          <span className="font-medium text-ink">Modalidad:</span>{" "}
          <span className="text-ink-soft">{modalidadEtiqueta[modalidad] ?? modalidad}</span>
        </p>
        <p>
          <span className="font-medium text-ink">Grupo:</span>{" "}
          <span className="text-ink-soft">{grupoNombre}</span>
        </p>
        <p>
          <span className="font-medium text-ink">Fecha de generación:</span>{" "}
          <span className="text-ink-soft">{fechaGeneracion}</span>
        </p>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-ink text-left">
            <th className="w-16 py-2 pr-2 font-semibold text-ink">N°</th>
            <th className="w-32 py-2 pr-2 font-semibold text-ink">DNI</th>
            <th className="py-2 font-semibold text-ink">Apellidos y nombres</th>
          </tr>
        </thead>
        <tbody>
          {alumnos.map((a, i) => (
            <tr key={a.id} className="border-b border-line">
              <td className="py-1.5 pr-2 font-mono-tab text-ink-soft">{i + 1}</td>
              <td className="py-1.5 pr-2 font-mono-tab text-ink-soft">{a.dni}</td>
              <td className="py-1.5 text-ink">
                {a.apellidos} {a.nombres}
              </td>
            </tr>
          ))}
          {!alumnos.length && (
            <tr>
              <td colSpan={3} className="py-6 text-center text-ink-soft">
                Este grupo no tiene alumnos matriculados vigentes.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="text-right text-xs text-ink-soft">
        Total: {alumnos.length} alumno{alumnos.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}
