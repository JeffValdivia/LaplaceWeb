"use client";

import { useActionState, useRef } from "react";
import { importarEstudiantesExcel, type ResultadoImportacion } from "../actions";

export function ImportarEstudiantesForm() {
  const [resultado, formAction, pending] = useActionState<ResultadoImportacion, FormData>(
    importarEstudiantesExcel,
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-col gap-4">
      <form
        ref={formRef}
        action={(formData) => {
          formAction(formData);
          formRef.current?.reset();
        }}
        className="flex flex-wrap items-center gap-3"
      >
        <input
          type="file"
          name="archivo"
          accept=".xlsx"
          required
          className="text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-gradient-to-r file:from-brand-navy file:to-brand-blue file:px-4 file:py-2 file:text-sm file:font-medium file:text-white file:transition-all file:duration-200 hover:file:brightness-110"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-gradient-to-r from-brand-navy to-brand-blue px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:brightness-110 hover:shadow-lg disabled:opacity-60"
        >
          {pending ? "Importando…" : "Importar"}
        </button>
      </form>

      {resultado && (
        <div className="flex flex-col gap-3">
          {resultado.creados > 0 && (
            <p className="rounded-md bg-ok-soft px-3 py-2 text-sm text-ok">
              Se matricularon {resultado.creados} alumno(s). Su contraseña
              provisional es su DNI; se les pedirá cambiarla en su primer
              ingreso.
            </p>
          )}
          {resultado.errores.length > 0 && (
            <div className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
              <p className="font-medium">
                {resultado.errores.length} fila(s) con error, no se cargaron:
              </p>
              <ul className="mt-1.5 list-disc space-y-1 pl-5">
                {resultado.errores.map((e, i) => (
                  <li key={i}>
                    {e.fila > 0 ? `Fila ${e.fila}: ` : ""}
                    {e.mensaje}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
