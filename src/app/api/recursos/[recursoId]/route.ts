import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { recursos, cursos, matriculas } from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { leerArchivo } from "@/lib/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ recursoId: string }> }
) {
  const { recursoId } = await params;
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return new NextResponse("No autorizado", { status: 401 });

  const [fila] = await db
    .select({
      grupoId: cursos.grupoId,
      archivoPath: recursos.archivoPath,
      tipoArchivo: recursos.tipoArchivo,
      titulo: recursos.titulo,
      docenteId: cursos.docenteId,
    })
    .from(recursos)
    .innerJoin(cursos, eq(cursos.id, recursos.cursoId))
    .where(eq(recursos.id, recursoId))
    .limit(1);

  if (!fila || !fila.archivoPath) return new NextResponse("No encontrado", { status: 404 });

  let autorizado = usuario.rol === "admin" || fila.docenteId === usuario.id;

  if (!autorizado && usuario.rol === "estudiante" && usuario.estudianteId) {
    const [matriculado] = await db
      .select({ id: matriculas.id })
      .from(matriculas)
      .where(
        and(eq(matriculas.grupoId, fila.grupoId), eq(matriculas.estudianteId, usuario.estudianteId))
      )
      .limit(1);
    autorizado = Boolean(matriculado);
  }

  if (!autorizado) return new NextResponse("No autorizado", { status: 403 });

  const bytes = await leerArchivo(fila.archivoPath);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": fila.tipoArchivo || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${fila.titulo.replace(/[^a-zA-Z0-9._ -]/g, "_")}"`,
    },
  });
}
