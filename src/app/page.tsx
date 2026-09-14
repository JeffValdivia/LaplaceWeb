import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/auth/session";

export default async function Home() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) redirect("/login");
  if (usuario.rol === "docente") redirect("/docente");
  if (usuario.rol === "estudiante") redirect("/portal");
  redirect("/dashboard");
}
