"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { registrarEstudiante } from "@/lib/auth/actions";

const campo =
  "rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue-light/40";
const etiqueta = "flex flex-col gap-1.5 text-sm";

const PROCESOS_POR_SEDE: Record<string, { value: string; label: string }[]> = {
  UCSM: [
    { value: "ordinario", label: "Ordinario" },
    { value: "extraordinario", label: "Extraordinario" },
    { value: "preca", label: "Preca" },
  ],
  UNSA: [
    { value: "ordinario", label: "Ordinario" },
    { value: "extraordinario", label: "Extraordinario" },
    { value: "ceprequintos", label: "Ceprequintos" },
  ],
};

type Sede = { id: string; nombre: string };
type Grupo = { id: string; nombre: string; sedeId: string };
type Carrera = { id: string; nombre: string };

export function RegistroForm({
  sedes,
  grupos,
  carreras,
}: {
  sedes: Sede[];
  grupos: Grupo[];
  carreras: Carrera[];
}) {
  const [error, formAction, pending] = useActionState(registrarEstudiante, null);
  const [sedeId, setSedeId] = useState("");
  const [grupoId, setGrupoId] = useState("");
  const [proceso, setProceso] = useState("");

  const sedeNombre = useMemo(() => sedes.find((s) => s.id === sedeId)?.nombre ?? "", [sedes, sedeId]);
  const gruposDeLaSede = useMemo(() => grupos.filter((g) => g.sedeId === sedeId), [grupos, sedeId]);
  const procesosDeLaSede = useMemo(() => PROCESOS_POR_SEDE[sedeNombre] ?? [], [sedeNombre]);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-sm font-medium text-ink">Datos del alumno</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={etiqueta}>
            <span className="font-medium text-ink">Apellidos</span>
            <input name="apellidos" required className={campo} />
          </label>
          <label className={etiqueta}>
            <span className="font-medium text-ink">Nombres</span>
            <input name="nombres" required className={campo} />
          </label>
          <label className={etiqueta}>
            <span className="font-medium text-ink">DNI</span>
            <input name="dni" required maxLength={8} autoComplete="username" className={campo} />
          </label>
          <label className={etiqueta}>
            <span className="font-medium text-ink">Fecha de nacimiento</span>
            <input type="date" name="fecha_nacimiento" required className={campo} />
          </label>
          <label className={etiqueta}>
            <span className="font-medium text-ink">Celular</span>
            <input name="celular" required className={campo} />
          </label>
          <label className={etiqueta}>
            <span className="font-medium text-ink">Correo electrónico</span>
            <input type="email" name="correo" required className={campo} />
          </label>
          <label className={etiqueta}>
            <span className="font-medium text-ink">Nombres del apoderado</span>
            <input name="apoderado_nombre" required className={campo} />
          </label>
          <label className={etiqueta}>
            <span className="font-medium text-ink">Celular del apoderado</span>
            <input name="apoderado_celular" required className={campo} />
          </label>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-t border-line pt-4">
        <legend className="mb-1 text-sm font-medium text-ink">Datos de la postulación</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={etiqueta}>
            <span className="font-medium text-ink">Sede</span>
            <select
              value={sedeId}
              onChange={(e) => {
                setSedeId(e.target.value);
                setGrupoId("");
                setProceso("");
              }}
              required
              className={campo}
            >
              <option value="" disabled>
                Selecciona…
              </option>
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className={etiqueta}>
            <span className="font-medium text-ink">Grupo</span>
            <select
              name="grupo_id"
              value={grupoId}
              onChange={(e) => setGrupoId(e.target.value)}
              required
              disabled={!sedeId}
              className={campo}
            >
              <option value="" disabled>
                {sedeId ? "Selecciona…" : "Elige primero una sede"}
              </option>
              {gruposDeLaSede.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className={etiqueta}>
            <span className="font-medium text-ink">Carrera a la que postula</span>
            <select name="carrera_id" required defaultValue="" className={campo}>
              <option value="" disabled>
                Selecciona…
              </option>
              {carreras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className={etiqueta}>
            <span className="font-medium text-ink">Proceso al que postula</span>
            <select
              name="proceso"
              value={proceso}
              onChange={(e) => setProceso(e.target.value)}
              required
              disabled={!sedeId}
              className={campo}
            >
              <option value="" disabled>
                {sedeId ? "Selecciona…" : "Elige primero una sede"}
              </option>
              {procesosDeLaSede.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className={etiqueta}>
            <span className="font-medium text-ink">Tipo de postulación</span>
            <select name="tipo_postulacion" required defaultValue="" className={campo}>
              <option value="" disabled>
                Selecciona…
              </option>
              <option value="egresado">Egresado</option>
              <option value="estudiante">Estudiante</option>
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-t border-line pt-4">
        <legend className="mb-1 text-sm font-medium text-ink">Tu cuenta de acceso</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={etiqueta}>
            <span className="font-medium text-ink">Contraseña</span>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              autoComplete="new-password"
              className={campo}
            />
          </label>
        </div>
      </fieldset>

      {error && (
        <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-blue disabled:opacity-60"
      >
        {pending ? "Creando…" : "Inscribirme y crear mi cuenta"}
      </button>

      <p className="text-center text-sm text-ink-soft">
        <Link href="/login" className="text-brand-blue hover:underline">
          Ya tengo cuenta, iniciar sesión
        </Link>
      </p>
    </form>
  );
}
