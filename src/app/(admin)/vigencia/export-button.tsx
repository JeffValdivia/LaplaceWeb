"use client";

type Fila = {
  dni: string;
  nombres: string;
  apellidos: string;
  sedeNombre: string;
  modalidad: string;
  grupoNombre: string;
  fechaIngreso: string;
  fechaFin: string;
  estado: string;
};

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

function aCsv(filas: Fila[]) {
  const encabezado = [
    "DNI",
    "Nombres",
    "Apellidos",
    "Sede",
    "Modalidad",
    "Grupo",
    "Ingreso",
    "Vence",
    "Estado",
  ];
  const escapar = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const filasCsv = filas.map((f) =>
    [
      f.dni,
      f.nombres,
      f.apellidos,
      f.sedeNombre,
      modalidadEtiqueta[f.modalidad] ?? f.modalidad,
      f.grupoNombre,
      f.fechaIngreso,
      f.fechaFin,
      f.estado,
    ]
      .map(escapar)
      .join(",")
  );
  return [encabezado.join(","), ...filasCsv].join("\r\n");
}

export function ExportarCsvButton({ filas }: { filas: Fila[] }) {
  const exportar = () => {
    const csv = "﻿" + aCsv(filas);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vigencia-matriculas-${new Date().toISOString().slice(0, 10)}.csv`;
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
