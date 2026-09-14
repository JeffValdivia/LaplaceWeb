import "server-only";
import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// En el VPS este volumen es /app/data/recursos (montado en
// docker-compose.yml). En desarrollo local es una carpeta del proyecto.
const RAIZ = process.env.RECURSOS_DIR || path.join(process.cwd(), "data", "recursos");

function rutaSegura(relativa: string) {
  // La ruta final depende de datos en tiempo de ejecución (el id del
  // curso, el nombre del archivo) — Turbopack no puede saberla en build,
  // así que dejamos explícito que no debe intentar rastrearla.
  const absoluta = path.join(/*turbopackIgnore: true*/ RAIZ, relativa);
  if (!absoluta.startsWith(RAIZ)) throw new Error("Ruta de archivo inválida.");
  return absoluta;
}

export async function guardarArchivo(cursoId: string, file: File) {
  const nombreSeguro = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const relativa = `${cursoId}/${randomUUID()}-${nombreSeguro}`;
  const absoluta = rutaSegura(relativa);

  await mkdir(path.dirname(absoluta), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absoluta, buffer);

  return relativa;
}

export async function leerArchivo(relativa: string) {
  return readFile(/*turbopackIgnore: true*/ rutaSegura(relativa));
}

export async function borrarArchivo(relativa: string) {
  try {
    await unlink(rutaSegura(relativa));
  } catch {
    // si ya no existe, no es un error real
  }
}
