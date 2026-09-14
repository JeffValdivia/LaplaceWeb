import "server-only";

// Marca de tiempo de la última vez que alguien usó la app de verdad (se
// actualiza desde obtenerUsuarioActual, que corre en casi todas las
// páginas). Vive en memoria del proceso Node — no se comparte con el
// runtime edge del proxy, pero no hace falta: solo la usa la limpieza
// periódica de sesiones para saber si el sitio está inactivo ahora mismo.
let ultimaActividad = Date.now();

export function marcarActividad() {
  ultimaActividad = Date.now();
}

export function milisegundosDesdeUltimaActividad() {
  return Date.now() - ultimaActividad;
}
