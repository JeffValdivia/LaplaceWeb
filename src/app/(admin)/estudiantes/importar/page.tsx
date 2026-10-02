import Link from "next/link";
import { ImportarEstudiantesForm } from "./form";

export default function ImportarEstudiantesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Cargar alumnos desde Excel</h1>
        <p className="text-sm text-ink-soft">
          Matricula varios alumnos a la vez. Cada fila se asigna a su grupo
          automáticamente según la Sede y el Grupo que escribas, y se crea su
          cuenta de acceso con contraseña provisional = su DNI (se les pedirá
          cambiarla en su primer ingreso).
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5">
        <h2 className="text-sm font-medium text-ink">1. Descarga la plantilla</h2>
        <p className="text-sm text-ink-soft">
          Trae las columnas en el orden correcto y listas desplegables para
          Sede, Grupo, Carrera, Proceso y Tipo de postulación, tomadas de los
          catálogos actuales.
        </p>
        <a
          href="/api/estudiantes/plantilla"
          className="self-start rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition hover:border-brand-blue hover:text-brand-blue"
        >
          Descargar plantilla (.xlsx)
        </a>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5">
        <h2 className="text-sm font-medium text-ink">2. Sube el Excel lleno</h2>
        <ImportarEstudiantesForm />
      </div>

      <p className="text-sm text-ink-soft">
        ¿Prefieres matricular de uno en uno?{" "}
        <Link href="/estudiantes/nuevo" className="underline">
          Usa el formulario normal
        </Link>
        .
      </p>
    </div>
  );
}
