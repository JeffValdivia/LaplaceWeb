import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { avancesAdjuntos, avancesClase, cursos } from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { leerArchivo } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ adjuntoId: string }> }
) {
  const { adjuntoId } = await params;
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return new NextResponse("No autorizado", { status: 401 });

  const [fila] = await db
    .select({
      archivoPath: avancesAdjuntos.archivoPath,
      tipoArchivo: avancesAdjuntos.tipoArchivo,
      tipo: avancesAdjuntos.tipo,
      nombre: avancesAdjuntos.nombre,
      docenteId: cursos.docenteId,
    })
    .from(avancesAdjuntos)
    .innerJoin(avancesClase, eq(avancesClase.id, avancesAdjuntos.avanceId))
    .innerJoin(cursos, eq(cursos.id, avancesClase.cursoId))
    .where(eq(avancesAdjuntos.id, adjuntoId))
    .limit(1);

  if (!fila) return new NextResponse("No encontrado", { status: 404 });

  const autorizado = usuario.rol === "admin" || fila.docenteId === usuario.id;
  if (!autorizado) return new NextResponse("No autorizado", { status: 403 });

  const bytes = await leerArchivo(fila.archivoPath);
  const disposicion = fila.tipo === "imagen" ? "inline" : "attachment";
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": fila.tipoArchivo || "application/octet-stream",
      "Content-Disposition": `${disposicion}; filename="${fila.nombre.replace(/[^a-zA-Z0-9._ -]/g, "_")}"`,
    },
  });
}
