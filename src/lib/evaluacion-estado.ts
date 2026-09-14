export function evaluacionAbierta(desde: Date | null, hasta: Date | null) {
  const ahora = Date.now();
  return (!desde || desde.getTime() <= ahora) && (!hasta || hasta.getTime() >= ahora);
}
