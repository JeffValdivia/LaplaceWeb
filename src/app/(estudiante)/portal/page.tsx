import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { matriculas, grupos, sedes, comunicados } from "@/lib/db/schema";
import { calcularEstado } from "@/lib/vigencia";
import { obtenerUsuarioActual } from "@/lib/auth/session";

const estadoTexto: Record<string, string> = {
  activa: "Activa",
  por_vencer: "Por vencer",
  vencida: "Vencida",
  retirada: "Retirada",
};

const estadoEstilo: Record<string, string> = {
  activa: "bg-ok-soft text-ok",
  por_vencer: "bg-warn-soft text-warn",
  vencida: "bg-danger-soft text-danger",
  retirada: "bg-line text-ink-soft",
};

const modalidadEtiqueta: Record<string, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

export default async function PortalInicioPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario?.estudianteId) redirect("/login");

  const [matriculasFilas, comunicadosFilas] = await Promise.all([
    db
      .select({
        fechaIngreso: matriculas.fechaIngreso,
        fechaFin: matriculas.fechaFin,
        retirada: matriculas.retirada,
        grupoId: grupos.id,
        grupoNombre: grupos.nombre,
        modalidad: grupos.modalidad,
        sedeNombre: sedes.nombre,
      })
      .from(matriculas)
      .innerJoin(grupos, eq(grupos.id, matriculas.grupoId))
      .innerJoin(sedes, eq(sedes.id, grupos.sedeId))
      .where(eq(matriculas.estudianteId, usuario.estudianteId))
      .orderBy(desc(matriculas.fechaIngreso)),
    db
      .select()
      .from(comunicados)
      .where(or(eq(comunicados.alcance, "academia")))
      .orderBy(desc(comunicados.createdAt))
      .limit(3),
  ]);

  const matricula = matriculasFilas[0];
  const estado = matricula ? calcularEstado(matricula.fechaFin, matricula.retirada) : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Mi matrícula</h1>
        <p className="text-sm text-ink-soft">Este es el resumen de tu matrícula.</p>
      </div>

      {matricula && estado ? (
        <div className="rounded-lg border border-line bg-surface p-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="font-medium text-ink">
              {matricula.sedeNombre} ·{" "}
              {modalidadEtiqueta[matricula.modalidad] ?? matricula.modalidad} ·{" "}
              {matricula.grupoNombre}
            </p>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${estadoEstilo[estado]}`}>
              {estadoTexto[estado]}
            </span>
          </div>
          <p className="font-mono-tab text-sm text-ink-soft">
            {matricula.fechaIngreso} → {matricula.fechaFin}
          </p>
        </div>
      ) : (
        <p className="rounded-lg border border-line bg-surface px-4 py-6 text-center text-sm text-ink-soft">
          No tienes una matrícula registrada todavía.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/portal/recursos"
          className="rounded-lg border border-line bg-surface p-4 text-center font-medium text-ink transition hover:border-brand-blue hover:text-brand-blue"
        >
          Campus virtual
        </Link>
        <Link
          href="/portal/evaluaciones"
          className="rounded-lg border border-line bg-surface p-4 text-center font-medium text-ink transition hover:border-brand-blue hover:text-brand-blue"
        >
          Evaluaciones
        </Link>
        <Link
          href="/portal/asistencia"
          className="rounded-lg border border-line bg-surface p-4 text-center font-medium text-ink transition hover:border-brand-blue hover:text-brand-blue"
        >
          Mi asistencia
        </Link>
        <Link
          href="/portal/comunicados"
          className="rounded-lg border border-line bg-surface p-4 text-center font-medium text-ink transition hover:border-brand-blue hover:text-brand-blue"
        >
          Comunicados
        </Link>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-soft">
          Últimos avisos
        </h2>
        <div className="flex flex-col gap-3">
          {comunicadosFilas.map((c) => (
            <div key={c.id} className="rounded-lg border border-line bg-surface p-4">
              <p className="font-medium text-ink">{c.titulo}</p>
              <p className="text-sm text-ink-soft">{c.mensaje}</p>
            </div>
          ))}
          {!comunicadosFilas.length && (
            <p className="rounded-lg border border-line bg-surface px-4 py-6 text-center text-sm text-ink-soft">
              Sin avisos todavía.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
