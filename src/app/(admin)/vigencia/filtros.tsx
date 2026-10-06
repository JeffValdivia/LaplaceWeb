"use client";

import { useMemo, useState } from "react";
import { ExportarCsvButton, type Fila } from "./export-button";

type Sede = { id: string; nombre: string };
type Grupo = { id: string; nombre: string; sedeId: string };

const campo =
  "rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-brand-blue disabled:cursor-not-allowed disabled:opacity-50";

export function FiltrosVigencia({
  sedes,
  grupos,
  estadoInicial,
  sedeInicial,
  grupoInicial,
  textoInicial,
  historialInicial,
  filas,
}: {
  sedes: Sede[];
  grupos: Grupo[];
  estadoInicial: string;
  sedeInicial: string;
  grupoInicial: string;
  textoInicial: string;
  historialInicial: boolean;
  filas: Fila[];
}) {
  const [sedeId, setSedeId] = useState(
    () => sedes.find((s) => s.nombre === sedeInicial)?.id ?? ""
  );
  const sedeNombre = sedes.find((s) => s.id === sedeId)?.nombre ?? "";
  const gruposDeLaSede = useMemo(
    () => grupos.filter((g) => g.sedeId === sedeId),
    [grupos, sedeId]
  );

  return (
    <form className="flex flex-wrap items-end gap-3 surface-card p-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">Buscar</span>
        <input
          type="text"
          name="q"
          defaultValue={textoInicial}
          placeholder="Nombre o apellido…"
          className={campo}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">Estado</span>
        <select name="estado" defaultValue={estadoInicial} className={campo}>
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
          value={sedeNombre}
          onChange={(e) => {
            const s = sedes.find((x) => x.nombre === e.target.value);
            setSedeId(s?.id ?? "");
          }}
          className={campo}
        >
          <option value="">Todas</option>
          {sedes.map((s) => (
            <option key={s.id} value={s.nombre}>
              {s.nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-ink">Grupo</span>
        <select
          name="grupo"
          defaultValue={grupoInicial}
          disabled={!sedeId}
          className={campo}
        >
          <option value="">{sedeId ? "Todos" : "Elige primero una sede"}</option>
          {gruposDeLaSede.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nombre}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-soft">
        <input type="checkbox" name="historial" value="1" defaultChecked={historialInicial} />
        Mostrar historial (matrículas ya renovadas)
      </label>
      <button
        type="submit"
        className="rounded-md bg-gradient-to-r from-brand-navy to-brand-blue px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:shadow-lg hover:brightness-110"
      >
        Filtrar
      </button>
      <div className="ml-auto">
        <ExportarCsvButton filas={filas} />
      </div>
    </form>
  );
}
