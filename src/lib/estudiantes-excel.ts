import ExcelJS from "exceljs";

// Mismas reglas que el formulario de matrícula (admin y autoregistro):
// qué procesos existen para cada sede.
export const PROCESOS_POR_SEDE: Record<string, { value: string; label: string }[]> = {
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

export const TIPOS_POSTULACION: { value: string; label: string }[] = [
  { value: "egresado", label: "Egresado" },
  { value: "estudiante", label: "Estudiante" },
];

export const ENCABEZADOS_PLANTILLA = [
  "Apellidos",
  "Nombres",
  "DNI",
  "Fecha de nacimiento (AAAA-MM-DD)",
  "Celular",
  "Correo electrónico",
  "Nombres del apoderado",
  "Celular del apoderado",
  "Sede",
  "Grupo",
  "Carrera",
  "Proceso",
  "Tipo de postulación",
  "Fecha de ingreso (AAAA-MM-DD, opcional)",
] as const;

const FILAS_DISPONIBLES = 300;

function columnaLetra(n: number): string {
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export async function generarPlantillaExcel({
  sedes,
  gruposPorSede,
  carreras,
}: {
  sedes: string[];
  gruposPorSede: Record<string, string[]>;
  carreras: string[];
}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "SGA Laplace";

  const hoja = wb.addWorksheet("Alumnos");
  hoja.addRow([...ENCABEZADOS_PLANTILLA]);
  hoja.getRow(1).font = { bold: true };
  hoja.columns = ENCABEZADOS_PLANTILLA.map((titulo) => ({ width: Math.max(18, titulo.length) }));

  const sedeEjemplo = sedes[0] ?? "";
  hoja.addRow([
    "Quispe Mamani",
    "Luis Alberto",
    "74123456",
    "2007-04-12",
    "987654321",
    "luis@correo.com",
    "María Mamani",
    "976543210",
    sedeEjemplo,
    gruposPorSede[sedeEjemplo]?.[0] ?? "",
    carreras[0] ?? "",
    PROCESOS_POR_SEDE[sedeEjemplo]?.[0]?.label ?? "",
    "Estudiante",
    "",
  ]);
  hoja.getRow(2).font = { italic: true, color: { argb: "FF9A9A9A" } };

  // Hoja auxiliar con las listas, fuente de los desplegables. Queda oculta
  // para no confundir al admin, pero las validaciones igual la leen.
  const cat = wb.addWorksheet("Catalogos");
  cat.state = "hidden";

  let col = 1;
  const rangoGrupoPorSede: Record<string, string> = {};
  for (const sede of sedes) {
    const letra = columnaLetra(col);
    const nombresGrupo = gruposPorSede[sede] ?? [];
    cat.getCell(1, col).value = sede;
    nombresGrupo.forEach((g, i) => (cat.getCell(2 + i, col).value = g));
    const filaFin = 1 + Math.max(1, nombresGrupo.length);
    rangoGrupoPorSede[sede] = `Catalogos!$${letra}$2:$${letra}$${filaFin}`;
    col++;
  }

  const rangoProcesoPorSede: Record<string, string> = {};
  for (const sede of sedes) {
    const letra = columnaLetra(col);
    const procesos = PROCESOS_POR_SEDE[sede] ?? [];
    cat.getCell(1, col).value = `PROC_${sede}`;
    procesos.forEach((p, i) => (cat.getCell(2 + i, col).value = p.label));
    const filaFin = 1 + Math.max(1, procesos.length);
    rangoProcesoPorSede[sede] = `Catalogos!$${letra}$2:$${letra}$${filaFin}`;
    col++;
  }

  const letraCarreras = columnaLetra(col);
  cat.getCell(1, col).value = "CARRERAS";
  carreras.forEach((c, i) => (cat.getCell(2 + i, col).value = c));
  const rangoCarreras = `Catalogos!$${letraCarreras}$2:$${letraCarreras}$${1 + Math.max(1, carreras.length)}`;
  col++;

  const letraSedes = columnaLetra(col);
  cat.getCell(1, col).value = "SEDES";
  sedes.forEach((s, i) => (cat.getCell(2 + i, col).value = s));
  const rangoSedes = `Catalogos!$${letraSedes}$2:$${letraSedes}$${1 + Math.max(1, sedes.length)}`;
  col++;

  for (const sede of sedes) {
    wb.definedNames.add(rangoGrupoPorSede[sede], sede);
    wb.definedNames.add(rangoProcesoPorSede[sede], `PROC_${sede}`);
  }

  const tiposFormula = `"${TIPOS_POSTULACION.map((t) => t.label).join(",")}"`;

  for (let fila = 2; fila <= FILAS_DISPONIBLES; fila++) {
    hoja.getCell(`D${fila}`).numFmt = "@";
    hoja.getCell(`N${fila}`).numFmt = "@";

    hoja.getCell(`I${fila}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [rangoSedes],
      showErrorMessage: true,
      errorStyle: "stop",
      error: "Elige una sede de la lista.",
    };
    hoja.getCell(`J${fila}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`INDIRECT($I${fila})`],
      showErrorMessage: true,
      errorStyle: "stop",
      error: "Elige primero una sede válida; luego un grupo de esa sede.",
    };
    hoja.getCell(`K${fila}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [rangoCarreras],
    };
    hoja.getCell(`L${fila}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`INDIRECT("PROC_"&$I${fila})`],
      showErrorMessage: true,
      errorStyle: "stop",
      error: "Elige primero una sede válida; luego un proceso de esa sede.",
    };
    hoja.getCell(`M${fila}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [tiposFormula],
    };
  }

  return wb.xlsx.writeBuffer();
}

export type FilaImportada = {
  apellidos: string;
  nombres: string;
  dni: string;
  fechaNacimiento: string;
  celular: string;
  correo: string;
  apoderadoNombre: string;
  apoderadoCelular: string;
  sede: string;
  grupo: string;
  carrera: string;
  proceso: string;
  tipoPostulacion: string;
  fechaIngreso: string;
};

function celdaTexto(valor: ExcelJS.CellValue): string {
  if (valor === null || valor === undefined) return "";
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  if (typeof valor === "object" && "text" in valor) return String(valor.text ?? "").trim();
  if (typeof valor === "object" && "result" in valor) return String(valor.result ?? "").trim();
  return String(valor).trim();
}

// Lee la hoja "Alumnos" de un Excel subido con el mismo formato que
// `generarPlantillaExcel`. Ignora filas completamente vacías.
export async function leerFilasExcel(buffer: ArrayBuffer): Promise<FilaImportada[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const hoja = wb.getWorksheet("Alumnos") ?? wb.worksheets[0];
  if (!hoja) return [];

  const filas: FilaImportada[] = [];
  hoja.eachRow((row, numero) => {
    if (numero === 1) return; // encabezado
    const valores = row.values as ExcelJS.CellValue[]; // índice 0 vacío, 1..14 = columnas A..N
    const get = (i: number) => celdaTexto(valores[i]);

    const fila: FilaImportada = {
      apellidos: get(1),
      nombres: get(2),
      dni: get(3),
      fechaNacimiento: get(4),
      celular: get(5),
      correo: get(6),
      apoderadoNombre: get(7),
      apoderadoCelular: get(8),
      sede: get(9),
      grupo: get(10),
      carrera: get(11),
      proceso: get(12),
      tipoPostulacion: get(13),
      fechaIngreso: get(14),
    };

    const vacia = Object.values(fila).every((v) => !v);
    if (!vacia) filas.push(fila);
  });

  return filas;
}
