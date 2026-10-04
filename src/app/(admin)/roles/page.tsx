import Link from "next/link";
import { asc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { usuarios, sedes } from "@/lib/db/schema";
import { NuevoUsuarioForm } from "./form";
import { RolSelect } from "./rol-select";
import { SedeDocenteSelect } from "./sede-select";

export default async function RolesPage() {
  const [lista, listaSedes] = await Promise.all([
    db
      .select({
        id: usuarios.id,
        nombreCompleto: usuarios.nombreCompleto,
        dni: usuarios.dni,
        rol: usuarios.rol,
        sedeId: usuarios.sedeId,
      })
      .from(usuarios)
      .where(inArray(usuarios.rol, ["admin", "docente"]))
      .orderBy(asc(usuarios.rol), asc(usuarios.nombreCompleto)),
    db.select({ id: sedes.id, nombre: sedes.nombre }).from(sedes).orderBy(asc(sedes.nombre)),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Seguridad y roles</h1>
        <p className="text-sm text-ink-soft">
          Crea aquí mismo las cuentas de otros administradores o docentes — no
          hace falta ningún panel externo. A cada docente se le asigna la sede
          donde dicta: al armar los cursos de un grupo solo se ofrecen los
          docentes de su sede. Los alumnos se gestionan en{" "}
          <Link href="/estudiantes" className="underline">
            Estudiantes y matrículas
          </Link>
          .
        </p>
      </div>

      <NuevoUsuarioForm sedes={listaSedes} />

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-soft">
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">DNI</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Sede (docentes)</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{u.nombreCompleto}</td>
                <td className="px-4 py-3 font-mono-tab text-ink-soft">{u.dni}</td>
                <td className="px-4 py-3">
                  <RolSelect id={u.id} rolActual={u.rol} />
                </td>
                <td className="px-4 py-3">
                  {u.rol === "docente" ? (
                    <SedeDocenteSelect id={u.id} sedeIdActual={u.sedeId} sedes={listaSedes} />
                  ) : (
                    <span className="text-xs text-ink-soft">—</span>
                  )}
                </td>
              </tr>
            ))}
            {!lista.length && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-soft">
                  Todavía no hay administradores ni docentes registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
