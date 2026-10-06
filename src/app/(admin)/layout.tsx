import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { cerrarSesion } from "@/lib/auth/actions";
import { AdminChrome } from "./admin-chrome";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) redirect("/login");
  if (usuario.rol !== "admin") {
    redirect(usuario.rol === "docente" ? "/docente" : "/portal");
  }

  const fechaCruda = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const fechaHoy = fechaCruda.charAt(0).toUpperCase() + fechaCruda.slice(1);

  return (
    <AdminChrome
      nombreCompleto={usuario.nombreCompleto}
      rol={usuario.rol}
      fechaHoy={fechaHoy}
      cerrarSesion={cerrarSesion}
    >
      {children}
    </AdminChrome>
  );
}
