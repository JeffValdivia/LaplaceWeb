import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { cerrarSesion } from "@/lib/auth/actions";
import { obtenerMisGruposYCursos } from "@/lib/docente-nav";
import { DocenteChrome } from "./docente-chrome";

export default async function DocenteLayout({ children }: { children: ReactNode }) {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) redirect("/login");
  if (usuario.rol !== "docente") {
    redirect(usuario.rol === "admin" ? "/dashboard" : "/portal");
  }

  const { grupos, cursosSinGrupo } = await obtenerMisGruposYCursos(usuario.id);

  return (
    <DocenteChrome
      nombreCompleto={usuario.nombreCompleto}
      grupos={grupos}
      cursosSinGrupo={cursosSinGrupo}
      cerrarSesion={cerrarSesion}
    >
      {children}
    </DocenteChrome>
  );
}
