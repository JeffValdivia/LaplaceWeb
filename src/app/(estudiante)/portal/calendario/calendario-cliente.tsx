"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export type EventoCalendario = {
  id: string;
  fecha: string; // AAAA-MM-DD
  tipo: "academico" | "examen" | "entrega";
  titulo: string;
  subtitulo?: string;
  // Sin href: evento programado desde /eventos, no tiene página propia.
  href?: string;
};

const TIPO_ESTILO: Record<
  EventoCalendario["tipo"],
  { punto: string; chip: string; label: string }
> = {
  academico: { punto: "bg-ok", chip: "bg-ok-soft text-ok", label: "Académico / General" },
  examen: { punto: "bg-warn", chip: "bg-warn-soft text-warn", label: "Exámenes" },
  entrega: {
    punto: "bg-danger",
    chip: "bg-danger-soft text-danger",
    label: "Revisiones / Entregas",
  },
};

const DIAS_SEMANA = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function claveFecha(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function celdasDelMes(cursor: Date) {
  const anio = cursor.getFullYear();
  const mes = cursor.getMonth();
  const primerDiaMes = new Date(anio, mes, 1);
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const offset = primerDiaMes.getDay();
  const totalCeldas = Math.ceil((offset + diasEnMes) / 7) * 7;

  return Array.from({ length: totalCeldas }, (_, i) => {
    const fecha = new Date(anio, mes, i - offset + 1);
    return { fecha, enMes: fecha.getMonth() === mes };
  });
}

export function CalendarioCliente({
  eventos,
  hoy,
}: {
  eventos: EventoCalendario[];
  hoy: string;
}) {
  const [cursor, setCursor] = useState(() => {
    const [y, m] = hoy.split("-").map(Number);
    return new Date(y, m - 1, 1);
  });
  const [vista, setVista] = useState<"mes" | "lista">("mes");

  const eventosPorFecha = useMemo(() => {
    const mapa = new Map<string, EventoCalendario[]>();
    for (const e of eventos) {
      const lista = mapa.get(e.fecha) ?? [];
      lista.push(e);
      mapa.set(e.fecha, lista);
    }
    return mapa;
  }, [eventos]);

  const celdas = useMemo(() => celdasDelMes(cursor), [cursor]);

  const prefijoMes = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
  const eventosDelMes = useMemo(
    () =>
      eventos
        .filter((e) => e.fecha.startsWith(prefijoMes))
        .sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [eventos, prefijoMes]
  );

  const irMesAnterior = () => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  const irMesSiguiente = () => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
  const irHoy = () => {
    const [y, m] = hoy.split("-").map(Number);
    setCursor(new Date(y, m - 1, 1));
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-blue">
          Portal académico
        </p>
        <h1 className="text-2xl font-semibold text-ink">
          Calendario <span className="text-brand-blue">Académico</span>
        </h1>
        <p className="text-sm text-ink-soft">
          Consulta tus evaluaciones, comunicados y fechas importantes.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-xl bg-brand-navy px-6 py-8 text-white">
        <div className="relative z-10 max-w-xl">
          <h2 className="text-xl font-semibold">Organiza tus fechas importantes</h2>
          <p className="mt-2 text-sm text-white/80">
            Este calendario se arma solo con tus evaluaciones y los comunicados de tu grupo —
            se actualiza automáticamente, sin datos de ejemplo.
          </p>
        </div>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="pointer-events-none absolute -right-2 top-1/2 h-28 w-28 -translate-y-1/2 text-white/10"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M3 9h18M8 2v4M16 2v4" />
        </svg>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="flex h-fit flex-col gap-4 rounded-lg border border-line bg-surface p-5">
          <h3 className="text-sm font-semibold text-ink">Resumen rápido</h3>
          <ul className="flex flex-col gap-3 text-sm">
            <li>
              <p className="font-medium text-ink">Calendario activo</p>
              <p className="text-xs text-ink-soft">Vista mensual y de lista</p>
            </li>
            <li>
              <p className="font-medium text-ink">Datos en vivo</p>
              <p className="text-xs text-ink-soft">
                Tomados de tus evaluaciones y comunicados reales
              </p>
            </li>
            <li>
              <p className="font-medium text-ink">Responsive</p>
              <p className="text-xs text-ink-soft">Optimizado para celular</p>
            </li>
          </ul>
          <div className="flex flex-col gap-2 border-t border-line pt-4">
            {Object.values(TIPO_ESTILO).map((info) => (
              <div key={info.label} className="flex items-center gap-2 text-sm text-ink">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${info.punto}`} />
                {info.label}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-surface p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={irMesAnterior}
                aria-label="Mes anterior"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-ink-soft transition hover:border-brand-blue hover:text-brand-blue"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={irHoy}
                className="rounded-md border border-line px-3 py-1.5 text-sm text-ink-soft transition hover:border-brand-blue hover:text-brand-blue"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={irMesSiguiente}
                aria-label="Mes siguiente"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-ink-soft transition hover:border-brand-blue hover:text-brand-blue"
              >
                ›
              </button>
            </div>
            <h2 className="text-lg font-semibold text-ink">
              {MESES[cursor.getMonth()]} de {cursor.getFullYear()}
            </h2>
            <div className="flex rounded-md border border-line p-0.5">
              <button
                type="button"
                onClick={() => setVista("mes")}
                className={`rounded px-3 py-1 text-sm font-medium transition ${
                  vista === "mes" ? "bg-brand-navy text-white" : "text-ink-soft hover:text-ink"
                }`}
              >
                Mes
              </button>
              <button
                type="button"
                onClick={() => setVista("lista")}
                className={`rounded px-3 py-1 text-sm font-medium transition ${
                  vista === "lista" ? "bg-brand-navy text-white" : "text-ink-soft hover:text-ink"
                }`}
              >
                Lista
              </button>
            </div>
          </div>

          {vista === "mes" ? (
            <div>
              <div className="grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wider text-ink-soft">
                {DIAS_SEMANA.map((d) => (
                  <div key={d} className="py-2">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-line bg-line">
                {celdas.map(({ fecha, enMes }) => {
                  const clave = claveFecha(fecha);
                  const esHoy = clave === hoy;
                  const eventosDia = eventosPorFecha.get(clave) ?? [];

                  return (
                    <div
                      key={clave}
                      className={`min-h-[92px] bg-surface p-1.5 ${!enMes ? "opacity-40" : ""}`}
                    >
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                          esHoy ? "bg-brand-navy font-semibold text-white" : "text-ink"
                        }`}
                      >
                        {fecha.getDate()}
                      </span>
                      <div className="mt-1 flex flex-col gap-0.5">
                        {eventosDia.slice(0, 2).map((e) => {
                          const className = `block truncate rounded px-1 py-0.5 text-[11px] ${TIPO_ESTILO[e.tipo].chip}`;
                          return e.href ? (
                            <Link key={e.id} href={e.href} title={e.titulo} className={className}>
                              {e.titulo}
                            </Link>
                          ) : (
                            <span key={e.id} title={e.titulo} className={className}>
                              {e.titulo}
                            </span>
                          );
                        })}
                        {eventosDia.length > 2 && (
                          <span className="text-[11px] text-ink-soft">
                            +{eventosDia.length - 2} más
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {eventosDelMes.length ? (
                eventosDelMes.map((e) => {
                  const className =
                    "flex items-center gap-3 rounded-lg border border-line p-3 transition hover:border-brand-blue";
                  const contenido = (
                    <>
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${TIPO_ESTILO[e.tipo].punto}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink">{e.titulo}</p>
                        {e.subtitulo && <p className="text-xs text-ink-soft">{e.subtitulo}</p>}
                      </div>
                      <span className="shrink-0 font-mono-tab text-xs text-ink-soft">
                        {e.fecha}
                      </span>
                    </>
                  );
                  return e.href ? (
                    <Link key={e.id} href={e.href} className={className}>
                      {contenido}
                    </Link>
                  ) : (
                    <div key={e.id} className={className}>
                      {contenido}
                    </div>
                  );
                })
              ) : (
                <p className="rounded-lg border border-line px-4 py-6 text-center text-sm text-ink-soft">
                  No hay eventos este mes.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
