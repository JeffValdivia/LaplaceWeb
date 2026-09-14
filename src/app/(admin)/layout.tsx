import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { cerrarSesion } from "@/lib/auth/actions";
import { Sidebar } from "@/components/sidebar";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) redirect("/login");
  if (usuario.rol !== "admin") {
    redirect(usuario.rol === "docente" ? "/docente" : "/portal");
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
          <div className="text-sm">
            <p className="font-medium text-ink">{usuario.nombreCompleto}</p>
            <p className="font-mono-tab text-xs uppercase tracking-wider text-ink-soft">
              {usuario.rol}
            </p>
          </div>
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="rounded-md border border-line px-3 py-1.5 text-sm text-ink-soft transition hover:border-brand-blue hover:text-brand-blue"
            >
              Cerrar sesión
            </button>
          </form>
        </header>
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
