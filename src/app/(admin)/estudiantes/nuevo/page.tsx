import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { grupos, sedes } from "@/lib/db/schema";
import { NuevoEstudianteForm } from "./form";

export default async function NuevoEstudiantePage() {
  const [listaSedes, listaGrupos] = await Promise.all([
    db.select().from(sedes).orderBy(asc(sedes.nombre)),
    db
      .select({
        id: grupos.id,
        nombre: grupos.nombre,
        modalidad: grupos.modalidad,
        sedeId: grupos.sedeId,
      })
      .from(grupos)
      .where(eq(grupos.activo, true))
      .orderBy(asc(grupos.nombre)),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Matricular estudiante</h1>
        <p className="text-sm text-ink-soft">
          La fecha de fin se calcula sola: 1 mes exacto desde la fecha de ingreso.
        </p>
      </div>

      {listaGrupos.length === 0 ? (
        <p className="rounded-lg border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn">
          Todavía no hay grupos académicos creados. Ve a{" "}
          <Link href="/sedes" className="underline">
            Sedes y asignaturas
          </Link>{" "}
          y crea uno antes de matricular.
        </p>
      ) : (
        <NuevoEstudianteForm sedes={listaSedes} grupos={listaGrupos} />
      )}
    </div>
  );
}
