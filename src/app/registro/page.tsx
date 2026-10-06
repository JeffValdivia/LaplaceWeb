import Image from "next/image";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sedes, grupos, carreras } from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { RegistroForm } from "./form";

export default async function RegistroPage() {
  const usuario = await obtenerUsuarioActual();
  if (usuario) redirect("/");

  const [listaSedes, listaGrupos, listaCarreras] = await Promise.all([
    db.select().from(sedes).orderBy(asc(sedes.nombre)),
    db
      .select({
        id: grupos.id,
        nombre: grupos.nombre,
        sedeId: grupos.sedeId,
      })
      .from(grupos)
      .where(eq(grupos.activo, true))
      .orderBy(asc(grupos.nombre)),
    db
      .select()
      .from(carreras)
      .where(eq(carreras.activo, true))
      .orderBy(asc(carreras.nombre)),
  ]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-2xl rounded-lg border border-line bg-surface p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image src="/brand/log-laplace.png" alt="Academia Laplace" width={88} height={88} priority />
          <div>
            <h1 className="text-lg font-semibold text-ink">Ficha de inscripción</h1>
            <p className="text-sm text-ink-soft">
              Completa tus datos para postular y crear tu cuenta del portal.
            </p>
          </div>
        </div>

        <RegistroForm sedes={listaSedes} grupos={listaGrupos} carreras={listaCarreras} />
      </div>
    </main>
  );
}
