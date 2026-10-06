import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { matriculas } from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { cerrarSesion } from "@/lib/auth/actions";
import { calcularEstado, diasParaVencer } from "@/lib/vigencia";
import { EstudianteChrome } from "./estudiante-chrome";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) redirect("/login");
  if (usuario.rol !== "estudiante") {
    redirect(usuario.rol === "docente" ? "/docente" : "/dashboard");
  }
  if (usuario.debeCambiarPassword) redirect("/cambiar-password");

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

  const aviso =
    estado === "por_vencer" && diasRestantes !== null ? (
      <div className="border-b border-warn/30 bg-warn-soft px-6 py-2.5 text-center text-sm font-medium text-warn">
        {diasRestantes <= 0
          ? "Tu matrícula vence hoy. Renueva tu mensualidad para no perder el acceso."
          : `Tu matrícula vence en ${diasRestantes} día${diasRestantes === 1 ? "" : "s"}. Renueva tu mensualidad para no perder el acceso.`}
      </div>
    ) : null;

  return (
    <EstudianteChrome
      nombreCompleto={usuario.nombreCompleto}
      bloqueado={bloqueado}
      cerrarSesion={cerrarSesion}
      aviso={aviso}
    >
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
    </EstudianteChrome>
  );
}
