import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { grupos, sedes, matriculas, estudiantes } from "@/lib/db/schema";
import { calcularEstado } from "@/lib/vigencia";
import { ListaAlumnosPreview } from "@/components/lista-alumnos-preview";
import { ImprimirButton } from "@/components/imprimir-button";

export default async function ListaAlumnosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [grupo] = await db
    .select({
      id: grupos.id,
      nombre: grupos.nombre,
      modalidad: grupos.modalidad,
      sedeNombre: sedes.nombre,
    })
    .from(grupos)
    .innerJoin(sedes, eq(sedes.id, grupos.sedeId))
    .where(eq(grupos.id, id))
    .limit(1);

  if (!grupo) notFound();

  const matriculasCrudas = await db
    .select({
      estudianteId: estudiantes.id,
      dni: estudiantes.dni,
      nombres: estudiantes.nombres,
      apellidos: estudiantes.apellidos,
      fechaIngreso: matriculas.fechaIngreso,
      fechaFin: matriculas.fechaFin,
      retirada: matriculas.retirada,
    })
    .from(matriculas)
    .innerJoin(estudiantes, eq(estudiantes.id, matriculas.estudianteId))
    .where(eq(matriculas.grupoId, id))
    .orderBy(asc(estudiantes.apellidos));

  // Solo la matrícula más reciente de cada alumno cuenta (igual que en
  // "Estudiantes y matrículas"), y solo entran a la lista los que siguen
  // activos o por vencer — un retirado o vencido ya no es alumno vigente
  // del grupo.
  const masRecientePorEstudiante = new Map<string, (typeof matriculasCrudas)[number]>();
  for (const m of matriculasCrudas) {
    const actual = masRecientePorEstudiante.get(m.estudianteId);
    if (!actual || m.fechaIngreso > actual.fechaIngreso) {
      masRecientePorEstudiante.set(m.estudianteId, m);
    }
  }

  const alumnos = [...masRecientePorEstudiante.values()]
    .filter((m) => {
      const estado = calcularEstado(m.fechaFin, m.retirada);
      return estado === "activa" || estado === "por_vencer";
    })
    .sort((a, b) => `${a.apellidos} ${a.nombres}`.localeCompare(`${b.apellidos} ${b.nombres}`))
    .map((m) => ({ id: m.estudianteId, dni: m.dni, nombres: m.nombres, apellidos: m.apellidos }));

  const fechaGeneracion = new Date().toLocaleDateString("es-PE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 print:max-w-none">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/reporte-alumnos" className="text-sm text-brand-blue hover:underline">
          ← Reporte de alumnos
        </Link>
        <ImprimirButton />
      </div>

      <ListaAlumnosPreview
        sedeNombre={grupo.sedeNombre}
        grupoNombre={grupo.nombre}
        modalidad={grupo.modalidad}
        alumnos={alumnos}
        fechaGeneracion={fechaGeneracion}
      />
    </div>
  );
}
