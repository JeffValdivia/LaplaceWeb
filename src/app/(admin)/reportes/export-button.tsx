"use client";

type Fila = {
  dni: string;
  nombres: string;
  apellidos: string;
  grupo: string;
  estadoMatricula: string;
  asistenciaPct: string;
  evaluacionesRendidas: string;
  promedio: string;
};

function aCsv(filas: Fila[]) {
  const encabezado = [
    "DNI",
    "Nombres",
    "Apellidos",
    "Grupo",
    "Estado matrícula",
    "% Asistencia",
    "Evaluaciones rendidas",
    "Promedio",
  ];
  const escapar = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const filasCsv = filas.map((f) =>
    [
      f.dni,
      f.nombres,
      f.apellidos,
      f.grupo,
      f.estadoMatricula,
      f.asistenciaPct,
      f.evaluacionesRendidas,
      f.promedio,
    ]
      .map(escapar)
      .join(",")
  );
  return [encabezado.join(","), ...filasCsv].join("\r\n");
}

export function ExportarReporteButton({ filas }: { filas: Fila[] }) {
  const exportar = () => {
    const csv = "﻿" + aCsv(filas);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-academico-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={exportar}
      disabled={filas.length === 0}
      className="rounded-md border border-line px-3 py-1.5 text-sm text-ink-soft transition hover:border-brand-blue hover:text-brand-blue disabled:opacity-50"
    >
      Exportar a Excel (CSV)
    </button>
  );
}
