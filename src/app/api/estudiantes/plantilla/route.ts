import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { carreras, grupos, sedes } from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { generarPlantillaExcel } from "@/lib/estudiantes-excel";

export async function GET() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario || usuario.rol !== "admin") {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const [listaSedes, listaGrupos, listaCarreras] = await Promise.all([
    db.select().from(sedes).orderBy(asc(sedes.nombre)),
    db
      .select({ nombre: grupos.nombre, sedeId: grupos.sedeId })
      .from(grupos)
      .where(eq(grupos.activo, true))
      .orderBy(asc(grupos.nombre)),
    db
      .select({ nombre: carreras.nombre })
      .from(carreras)
      .where(eq(carreras.activo, true))
      .orderBy(asc(carreras.nombre)),
  ]);

  const gruposPorSede: Record<string, string[]> = {};
  for (const sede of listaSedes) {
    gruposPorSede[sede.nombre] = listaGrupos
      .filter((g) => g.sedeId === sede.id)
      .map((g) => g.nombre);
  }

  const buffer = await generarPlantillaExcel({
    sedes: listaSedes.map((s) => s.nombre),
    gruposPorSede,
    carreras: listaCarreras.map((c) => c.nombre),
  });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla-matricula-alumnos.xlsx"',
    },
  });
}
