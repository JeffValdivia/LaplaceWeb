"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { actualizarEstudiante } from "./actions";

const campo =
  "rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue-light/40";
const etiqueta = "flex flex-col gap-1.5 text-sm";

export type EstudianteEditable = {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string | null;
  telefono: string | null;
  email: string | null;
  apoderadoNombre: string | null;
  apoderadoTelefono: string | null;
};

export function EditarEstudianteModal({ estudiante }: { estudiante: EstudianteEditable }) {
  const [abierto, setAbierto] = useState(false);
  const [error, formAction, pending] = useActionState(actualizarEstudiante, null);
  const estabaEnviando = useRef(false);

  useEffect(() => {
    if (pending) {
      estabaEnviando.current = true;
      return;
    }
    if (estabaEnviando.current && !error) {
      estabaEnviando.current = false;
      setAbierto(false);
    }
  }, [pending, error]);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="text-xs font-medium text-brand-blue underline decoration-dotted hover:decoration-solid"
      >
        Editar
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Editar estudiante"
          onClick={() => setAbierto(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-lg bg-surface p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-ink">Editar datos del alumno</h2>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
                className="rounded-md px-2 py-1 text-ink-soft hover:bg-bg hover:text-ink"
              >
                ✕
              </button>
            </div>

            <form action={formAction} className="flex flex-col gap-3">
              <input type="hidden" name="id" value={estudiante.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={etiqueta}>
                  <span className="font-medium text-ink">Apellidos</span>
                  <input name="apellidos" required defaultValue={estudiante.apellidos} className={campo} />
                </label>
                <label className={etiqueta}>
                  <span className="font-medium text-ink">Nombres</span>
                  <input name="nombres" required defaultValue={estudiante.nombres} className={campo} />
                </label>
                <label className={etiqueta}>
                  <span className="font-medium text-ink">DNI</span>
                  <input name="dni" required maxLength={8} defaultValue={estudiante.dni} className={campo} />
                </label>
                <label className={etiqueta}>
                  <span className="font-medium text-ink">Fecha de nacimiento</span>
                  <input
                    type="date"
                    name="fecha_nacimiento"
                    defaultValue={estudiante.fechaNacimiento ?? ""}
                    className={campo}
                  />
                </label>
                <label className={etiqueta}>
                  <span className="font-medium text-ink">Celular</span>
                  <input name="telefono" defaultValue={estudiante.telefono ?? ""} className={campo} />
                </label>
                <label className={etiqueta}>
                  <span className="font-medium text-ink">Correo electrónico</span>
                  <input type="email" name="email" defaultValue={estudiante.email ?? ""} className={campo} />
                </label>
                <label className={etiqueta}>
                  <span className="font-medium text-ink">Nombres del apoderado</span>
                  <input
                    name="apoderado_nombre"
                    defaultValue={estudiante.apoderadoNombre ?? ""}
                    className={campo}
                  />
                </label>
                <label className={etiqueta}>
                  <span className="font-medium text-ink">Celular del apoderado</span>
                  <input
                    name="apoderado_telefono"
                    defaultValue={estudiante.apoderadoTelefono ?? ""}
                    className={campo}
                  />
                </label>
              </div>

              {error && <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-md bg-gradient-to-r from-brand-navy to-brand-blue px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
                >
                  {pending ? "Guardando…" : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="rounded-md border border-line px-4 py-2 text-sm text-ink-soft hover:bg-bg"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
