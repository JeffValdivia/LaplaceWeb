import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matriculas, grupos, sedes } from "@/lib/db/schema";
import { calcularEstado } from "@/lib/vigencia";

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

export default async function EstudiantesPage() {
  const [listaSedes, listaGrupos, matriculasCrudas] = await Promise.all([
    db.select().from(sedes).orderBy(asc(sedes.nombre)),
    db
      .select({
        id: grupos.id,
        nombre: grupos.nombre,
        modalidad: grupos.modalidad,
        sedeId: grupos.sedeId,
      })
      .from(grupos)
      .where(eq(grupos.activo, true))
      .orderBy(asc(grupos.nombre)),
    db
      .select({
        estudianteId: matriculas.estudianteId,
        grupoId: matriculas.grupoId,
        fechaIngreso: matriculas.fechaIngreso,
        fechaFin: matriculas.fechaFin,
        retirada: matriculas.retirada,
      })
      .from(matriculas)
      .orderBy(desc(matriculas.fechaIngreso)),
  ]);

  // Un estudiante puede tener varias matrículas (por renovaciones); para
  // contar solo importa la más reciente de cada uno, igual que en el
  // dashboard — si ya renovó, su matrícula vieja no debe seguir sumando.
  const masRecientePorEstudiante = new Map<string, (typeof matriculasCrudas)[number]>();
  for (const m of matriculasCrudas) {
    if (!masRecientePorEstudiante.has(m.estudianteId)) {
      masRecientePorEstudiante.set(m.estudianteId, m);
    }
  }

  const conteoPorGrupo = new Map<string, number>();
  for (const m of masRecientePorEstudiante.values()) {
    if (!m.grupoId) continue;
    const estado = calcularEstado(m.fechaFin, m.retirada);
    if (estado === "retirada" || estado === "vencida") continue;
    conteoPorGrupo.set(m.grupoId, (conteoPorGrupo.get(m.grupoId) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Estudiantes y matrículas</h1>
          <p className="text-sm text-ink-soft">
            Alumnos matriculados por grupo (activos y por vencer). El detalle,
            renovaciones y retiros están en{" "}
            <Link href="/vigencia" className="underline">
              Vigencia de matrícula
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/estudiantes/importar"
            className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition hover:border-brand-blue hover:text-brand-blue"
          >
            Cargar Excel
          </Link>
          <Link
            href="/estudiantes/nuevo"
            className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-blue"
          >
            Matricular estudiante
          </Link>
        </div>
      </div>

      {listaSedes.map((s) => {
        const gruposDeLaSede = listaGrupos.filter((g) => g.sedeId === s.id);
        return (
          <div
            key={s.id}
            className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5"
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink">
              {s.nombre}
            </h2>
            {gruposDeLaSede.length ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {gruposDeLaSede.map((g) => (
                  <div
                    key={g.id}
                    className="flex flex-col gap-1 rounded-lg border border-line bg-bg p-4"
                  >
                    <span className="text-xs text-ink-soft">
                      {g.nombre} · {modalidadEtiqueta[g.modalidad] ?? g.modalidad}
                    </span>
                    <span className="font-mono-tab text-2xl font-semibold text-ink">
                      {conteoPorGrupo.get(g.id) ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm italic text-ink-soft">Esta sede todavía no tiene grupos.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
