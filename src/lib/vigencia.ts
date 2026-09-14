export type EstadoMatricula = "activa" | "por_vencer" | "vencida" | "retirada";

// Días antes del vencimiento en que empieza a avisarse al estudiante.
const DIAS_AVISO = 5;

export function diasParaVencer(fechaFin: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fin = new Date(fechaFin + "T00:00:00");
  return Math.round((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

export function calcularEstado(fechaFin: string, retirada: boolean): EstadoMatricula {
  if (retirada) return "retirada";

  const diffDias = diasParaVencer(fechaFin);

  if (diffDias < 0) return "vencida";
  if (diffDias <= DIAS_AVISO) return "por_vencer";
  return "activa";
}

export function sumarUnMes(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  const f = new Date(y, m - 1, d);
  f.setMonth(f.getMonth() + 1);
  return f.toISOString().slice(0, 10);
}

export function sumarUnDia(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  const f = new Date(y, m - 1, d);
  f.setDate(f.getDate() + 1);
  return f.toISOString().slice(0, 10);
}
