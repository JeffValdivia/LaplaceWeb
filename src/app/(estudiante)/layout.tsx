import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matriculas } from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { cerrarSesion } from "@/lib/auth/actions";
import { calcularEstado, diasParaVencer } from "@/lib/vigencia";

const enlaces = [
  { href: "/portal", label: "Inicio" },
  { href: "/portal/recursos", label: "Campus virtual" },
  { href: "/portal/evaluaciones", label: "Evaluaciones" },
  { href: "/portal/asistencia", label: "Asistencia" },
  { href: "/portal/comunicados", label: "Comunicados" },
];

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) redirect("/login");
  if (usuario.rol !== "estudiante") {
    redirect(usuario.rol === "docente" ? "/docente" : "/dashboard");
  }

  const [ultimaMatricula] = usuario.estudianteId
    ? await db
        .select({ fechaFin: matriculas.fechaFin, retirada: matriculas.retirada })
        .from(matriculas)
        .where(eq(matriculas.estudianteId, usuario.estudianteId))
        .orderBy(desc(matriculas.fechaIngreso))
        .limit(1)
    : [];

  const estado = ultimaMatricula
    ? calcularEstado(ultimaMatricula.fechaFin, ultimaMatricula.retirada)
    : null;
  const bloqueado = estado === "vencida" || estado === "retirada";
  const diasRestantes = ultimaMatricula ? diasParaVencer(ultimaMatricula.fechaFin) : null;

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-surface px-6 py-3">
        <Link href="/portal" className="flex items-center gap-3">
          <Image src="/brand/logo-laplace.png" alt="" width={32} height={32} />
          <span className="text-sm font-semibold leading-tight text-ink">
            SGA
            <br />
            <span className="text-xs font-normal text-ink-soft">Portal del estudiante</span>
          </span>
        </Link>
        {!bloqueado && (
          <nav className="flex flex-wrap items-center gap-1">
            {enlaces.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                className="rounded-md px-3 py-1.5 text-sm text-ink-soft transition hover:bg-bg hover:text-ink"
              >
                {e.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium text-ink">{usuario.nombreCompleto}</p>
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="rounded-md border border-line px-3 py-1.5 text-sm text-ink-soft transition hover:border-brand-blue hover:text-brand-blue"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      {estado === "por_vencer" && diasRestantes !== null && (
        <div className="border-b border-warn/30 bg-warn-soft px-6 py-2.5 text-center text-sm font-medium text-warn">
          {diasRestantes <= 0
            ? "Tu matrícula vence hoy. Renueva tu mensualidad para no perder el acceso."
            : `Tu matrícula vence en ${diasRestantes} día${diasRestantes === 1 ? "" : "s"}. Renueva tu mensualidad para no perder el acceso.`}
        </div>
      )}

      <main className="flex-1 px-6 py-8">
        {bloqueado ? (
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-lg border border-line bg-surface px-6 py-10 text-center">
            <h1 className="text-lg font-semibold text-ink">
              {estado === "vencida" ? "Tu matrícula venció" : "Tu matrícula no está activa"}
            </h1>
            <p className="text-sm text-ink-soft">
              Tus datos y tu historial siguen guardados. Para recuperar el
              acceso al campus virtual, evaluaciones y asistencia, acércate a
              la academia para renovar tu mensualidad.
            </p>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
