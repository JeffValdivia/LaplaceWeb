import Link from "next/link";
import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  estudiantes,
  matriculas,
  grupos,
  sedes,
  asistencias,
  evaluaciones,
  cursos,
  preguntas,
  intentos,
} from "@/lib/db/schema";
import { calcularEstado } from "@/lib/vigencia";
import { hexPorSede } from "@/lib/tema-sede";
import { BarraHorizontal, type ItemBarra } from "@/components/charts/barra-horizontal";
import { DonutChart } from "@/components/charts/donut-chart";
import { BarrasColumna, type PuntoColumna } from "@/components/charts/barras-columna";

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

const mesesCorto = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

export default async function DashboardPage() {
  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
  const diasEnMesActual = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  const desdeMes = `${mesActual}-01`;
  const hastaMes = `${mesActual}-${String(diasEnMesActual).padStart(2, "0")}`;

  const [
    [{ totalEstudiantes }],
    matriculasCrudas,
    [{ totalGrupos }],
    gruposConSede,
    asistenciaDelMes,
    intentosCrudos,
    preguntasCrudas,
  ] = await Promise.all([
    db.select({ totalEstudiantes: count() }).from(estudiantes),
    db
      .select({
        estudianteId: matriculas.estudianteId,
        fechaIngreso: matriculas.fechaIngreso,
        fechaFin: matriculas.fechaFin,
        retirada: matriculas.retirada,
        sedeNombre: sedes.nombre,
        modalidad: grupos.modalidad,
      })
      .from(matriculas)
      .leftJoin(grupos, eq(grupos.id, matriculas.grupoId))
      .leftJoin(sedes, eq(sedes.id, grupos.sedeId))
      .orderBy(desc(matriculas.fechaIngreso)),
    db.select({ totalGrupos: count() }).from(grupos).where(eq(grupos.activo, true)),
    db
      .select({ id: grupos.id, sedeNombre: sedes.nombre })
      .from(grupos)
      .innerJoin(sedes, eq(sedes.id, grupos.sedeId))
      .where(eq(grupos.activo, true)),
    db
      .select({ estado: asistencias.estado, cantidad: count() })
      .from(asistencias)
      .where(and(gte(asistencias.fecha, desdeMes), lte(asistencias.fecha, hastaMes)))
      .groupBy(asistencias.estado),
    db
      .select({
        evaluacionId: intentos.evaluacionId,
        puntajeObtenido: intentos.puntajeObtenido,
        entregadoAt: intentos.entregadoAt,
        grupoNombre: grupos.nombre,
      })
      .from(intentos)
      .innerJoin(evaluaciones, eq(evaluaciones.id, intentos.evaluacionId))
      .innerJoin(cursos, eq(cursos.id, evaluaciones.cursoId))
      .leftJoin(grupos, eq(grupos.id, cursos.grupoId)),
    db.select({ evaluacionId: preguntas.evaluacionId, puntaje: preguntas.puntaje }).from(preguntas),
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
  const vigentesConEstado = [...masRecientePorEstudiante.values()].map((m) => ({
    ...m,
    estado: calcularEstado(m.fechaFin, m.retirada),
  }));
  const contar = (estado: string) => vigentesConEstado.filter((e) => e.estado === estado).length;

  const tiles = [
    { label: "Estudiantes registrados", value: totalEstudiantes },
    { label: "Matrículas activas", value: contar("activa") },
    { label: "Por vencer (≤ 5 días)", value: contar("por_vencer"), warn: true },
    { label: "Matrículas vencidas", value: contar("vencida"), danger: true },
    { label: "Grupos activos", value: totalGrupos },
  ];

  // ── Estado de matrículas (donut) ──
  const segmentosEstado = [
    { label: "Activa", value: contar("activa"), colorHex: "#1f7a4d" },
    { label: "Por vencer", value: contar("por_vencer"), colorHex: "#a5680a" },
    { label: "Vencida", value: contar("vencida"), colorHex: "#b3392c" },
    { label: "Retirada", value: contar("retirada"), colorHex: "#9aa1b8" },
  ];

  // ── Estudiantes vigentes por sede / grupos activos por sede ──
  const vigentes = vigentesConEstado.filter(
    (v) => v.estado === "activa" || v.estado === "por_vencer"
  );
  const sedesPresentes = [...new Set(vigentes.map((v) => v.sedeNombre).filter((s): s is string => !!s))];
  const estudiantesPorSede: ItemBarra[] = sedesPresentes.map((nombre) => ({
    label: nombre,
    value: vigentes.filter((v) => v.sedeNombre === nombre).length,
    colorHex: hexPorSede[nombre] ?? "#2c4bb0",
  }));
  const gruposPorSede: ItemBarra[] = [...new Set(gruposConSede.map((g) => g.sedeNombre))].map(
    (nombre) => ({
      label: nombre,
      value: gruposConSede.filter((g) => g.sedeNombre === nombre).length,
      colorHex: hexPorSede[nombre] ?? "#2c4bb0",
    })
  );

  // ── Estudiantes vigentes por modalidad ──
  const modalidadesPresentes = [...new Set(vigentes.map((v) => v.modalidad).filter((m): m is string => !!m))];
  const estudiantesPorModalidad: ItemBarra[] = modalidadesPresentes.map((m, i) => ({
    label: modalidadEtiqueta[m] ?? m,
    value: vigentes.filter((v) => v.modalidad === m).length,
    colorHex: i === 0 ? "#2c4bb0" : "#5c85e6",
  }));

  // ── Asistencia del mes (todas las sedes/cursos) ──
  const totalAsistenciasMes = asistenciaDelMes.reduce((a, r) => a + r.cantidad, 0);
  const estadoAsistenciaEtiqueta: Record<string, string> = {
    presente: "Presente",
    tardanza: "Tardanza",
    falta: "Falta",
    justificado: "Justificado",
  };
  const estadoAsistenciaColor: Record<string, string> = {
    presente: "#1f7a4d",
    tardanza: "#a5680a",
    falta: "#b3392c",
    justificado: "#5c85e6",
  };
  const asistenciaItems: ItemBarra[] = (["presente", "tardanza", "falta", "justificado"] as const).map(
    (estado) => {
      const cantidad = asistenciaDelMes.find((r) => r.estado === estado)?.cantidad ?? 0;
      const pct = totalAsistenciasMes ? Math.round((cantidad / totalAsistenciasMes) * 100) : 0;
      return {
        label: estadoAsistenciaEtiqueta[estado],
        value: pct,
        colorHex: estadoAsistenciaColor[estado],
        sublabel: `(${cantidad})`,
      };
    }
  );

  // ── Matrículas nuevas — últimos 6 meses ──
  const puntosMatriculas: PuntoColumna[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - (5 - i), 1);
    const clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const cantidad = matriculasCrudas.filter((m) => m.fechaIngreso.startsWith(clave)).length;
    return { label: mesesCorto[d.getMonth()], value: cantidad };
  });

  // ── Top grupos por promedio de evaluaciones ──
  const totalPorEvaluacion = new Map<string, number>();
  for (const p of preguntasCrudas) {
    totalPorEvaluacion.set(p.evaluacionId, (totalPorEvaluacion.get(p.evaluacionId) ?? 0) + Number(p.puntaje ?? 0));
  }
  const porcentajesPorGrupo = new Map<string, number[]>();
  for (const i of intentosCrudos) {
    if (!i.entregadoAt || !i.grupoNombre) continue;
    const total = totalPorEvaluacion.get(i.evaluacionId) ?? 0;
    if (total <= 0) continue;
    const pct = (Number(i.puntajeObtenido ?? 0) / total) * 100;
    const lista = porcentajesPorGrupo.get(i.grupoNombre) ?? [];
    lista.push(pct);
    porcentajesPorGrupo.set(i.grupoNombre, lista);
  }
  const topGrupos: ItemBarra[] = [...porcentajesPorGrupo.entries()]
    .map(([grupoNombre, pcts]) => ({
      label: grupoNombre,
      value: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length),
      colorHex: "#2c4bb0",
      sublabel: `(${pcts.length} intento${pcts.length === 1 ? "" : "s"})`,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Dashboard administrativo</h1>
        <p className="text-sm text-ink-soft">
          Vista general de la academia al{" "}
          {hoy.toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => (
          <div
            key={t.label}
            className={`relative flex flex-col gap-1 overflow-hidden surface-card p-4 hover:-translate-y-0.5 hover:shadow-md ${
              t.danger
                ? "hover:bg-danger/10"
                : t.warn
                  ? "hover:bg-warn/10"
                  : "hover:bg-brand-blue-light/10"
            }`}
          >
            <span
              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${
                t.danger
                  ? "from-danger to-danger/60"
                  : t.warn
                    ? "from-warn to-warn/60"
                    : "from-brand-navy to-brand-blue"
              }`}
            />
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

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-3 surface-card p-5 hover:shadow-md">
          <h2 className="text-sm font-semibold text-ink">Estado de matrículas</h2>
          <DonutChart segmentos={segmentosEstado} />
        </div>
        <div className="flex flex-col gap-3 surface-card p-5 hover:shadow-md">
          <h2 className="text-sm font-semibold text-ink">Estudiantes vigentes por sede</h2>
          <BarraHorizontal items={estudiantesPorSede} />
        </div>
        <div className="flex flex-col gap-3 surface-card p-5 hover:shadow-md">
          <h2 className="text-sm font-semibold text-ink">Grupos activos por sede</h2>
          <BarraHorizontal items={gruposPorSede} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3 surface-card p-5 hover:shadow-md">
          <h2 className="text-sm font-semibold text-ink">Estudiantes vigentes por modalidad</h2>
          <BarraHorizontal items={estudiantesPorModalidad} />
        </div>
        <div className="flex flex-col gap-3 surface-card p-5 hover:shadow-md">
          <h2 className="text-sm font-semibold text-ink">
            Asistencia del mes ·{" "}
            {hoy.toLocaleDateString("es-PE", { month: "long", year: "numeric" })}
          </h2>
          <BarraHorizontal items={asistenciaItems} sufijo="%" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3 surface-card p-5 hover:shadow-md">
          <h2 className="text-sm font-semibold text-ink">Matrículas nuevas — últimos 6 meses</h2>
          <BarrasColumna puntos={puntosMatriculas} />
        </div>
        <div className="flex flex-col gap-3 surface-card p-5 hover:shadow-md">
          <h2 className="text-sm font-semibold text-ink">Top 5 grupos por promedio de evaluaciones</h2>
          <BarraHorizontal items={topGrupos} sufijo="%" />
        </div>
      </div>
    </div>
  );
}
