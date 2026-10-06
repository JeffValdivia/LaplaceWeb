import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/auth/session";

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  const usuario = await obtenerUsuarioActual();
  if (usuario) redirect("/");
  return children;
}
