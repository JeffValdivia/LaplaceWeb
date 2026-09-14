import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { estudiantes, matriculas, grupos } from "@/lib/db/schema";
import { calcularEstado } from "@/lib/vigencia";

export default async function DashboardPage() {
  const [[{ totalEstudiantes }], matriculasCrudas, [{ totalGrupos }]] = await Promise.all([
    db.select({ totalEstudiantes: count() }).from(estudiantes),
    db
      .select({
        estudianteId: matriculas.estudianteId,
        fechaFin: matriculas.fechaFin,
        retirada: matriculas.retirada,
      })
      .from(matriculas)
      .orderBy(desc(matriculas.fechaIngreso)),
    db
      .select({ totalGrupos: count() })
      .from(grupos)
      .where(eq(grupos.activo, true)),
  ]);

  // Un estudiante puede tener varias matrículas (por renovaciones); para
  // los conteos solo cuenta la más reciente de cada uno — si ya renovó,
  // su matrícula vieja no debe seguir sumando como "vencida".
  const masRecientePorEstudiante = new Map<string, (typeof matriculasCrudas)[number]>();
  for (const m of matriculasCrudas) {
    if (!masRecientePorEstudiante.has(m.estudianteId)) {
      masRecientePorEstudiante.set(m.estudianteId, m);
    }
  }

  const estados = [...masRecientePorEstudiante.values()].map((m) =>
    calcularEstado(m.fechaFin, m.retirada)
  );
  const contar = (estado: string) => estados.filter((e) => e === estado).length;

  const tiles = [
    { label: "Estudiantes registrados", value: totalEstudiantes },
    { label: "Matrículas activas", value: contar("activa") },
    { label: "Por vencer (≤ 5 días)", value: contar("por_vencer"), warn: true },
    { label: "Matrículas vencidas", value: contar("vencida"), danger: true },
    { label: "Grupos activos", value: totalGrupos },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-ink">Dashboard administrativo</h1>
        <p className="text-sm text-ink-soft">
          Vista general de la academia al{" "}
          {new Date().toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
          .
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="flex flex-col gap-1 rounded-lg border border-line bg-surface p-4"
          >
            <span className="text-xs text-ink-soft">{t.label}</span>
            <span
              className={`font-mono-tab text-2xl font-semibold ${
                t.danger ? "text-danger" : t.warn ? "text-warn" : "text-ink"
              }`}
            >
              {t.value}
            </span>
          </div>
        ))}
      </div>

      {contar("por_vencer") > 0 && (
        <div className="rounded-lg border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
          Hay {contar("por_vencer")} matrícula(s) que vencen en los próximos 5 días.
          Revísalas en{" "}
          <Link href="/estudiantes" className="underline">
            Estudiantes y matrículas
          </Link>
          .
        </div>
      )}
    </div>
  );
}
