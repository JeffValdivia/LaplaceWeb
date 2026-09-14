import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { cerrarSesion } from "@/lib/auth/actions";

export default async function DocenteLayout({ children }: { children: ReactNode }) {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) redirect("/login");
  if (usuario.rol !== "docente") {
    redirect(usuario.rol === "admin" ? "/dashboard" : "/portal");
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
        <Link href="/docente" className="flex items-center gap-3">
          <Image src="/brand/logo-laplace.png" alt="" width={32} height={32} />
          <span className="text-sm font-semibold leading-tight text-ink">
            SGA
            <br />
            <span className="text-xs font-normal text-ink-soft">Área docente</span>
          </span>
        </Link>
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
      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
