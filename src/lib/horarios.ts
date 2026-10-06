export const DIAS_SEMANA: { value: number; label: string }[] = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
];

export const diaSemanaTexto: Record<number, string> = Object.fromEntries(
  DIAS_SEMANA.map((d) => [d.value, d.label])
);

// Las columnas `time` de Postgres llegan como "HH:MM:SS" — se recorta a
// "HH:MM" para mostrar.
export function formatearHora(hora: string): string {
  return hora.slice(0, 5);
}
