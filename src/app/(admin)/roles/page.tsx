import Link from "next/link";
import { asc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { usuarios, sedes, asignaturas } from "@/lib/db/schema";
import { NuevoUsuarioForm } from "./form";
import { RolSelect } from "./rol-select";
import { SedeDocenteSelect } from "./sede-select";
import { AsignaturasDocente } from "./asignaturas-docente";

export default async function RolesPage() {
  const [lista, listaSedes, listaAsignaturas] = await Promise.all([
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
    db
      .select({
        id: asignaturas.id,
        nombre: asignaturas.nombre,
        sedeId: asignaturas.sedeId,
        docenteId: asignaturas.docenteId,
      })
      .from(asignaturas)
      .orderBy(asc(asignaturas.nombre)),
  ]);

  const nombrePorId = new Map(lista.map((u) => [u.id, u.nombreCompleto]));
  const opcionesAsignaturas = listaAsignaturas.map((a) => ({
    ...a,
    docenteNombre: a.docenteId ? (nombrePorId.get(a.docenteId) ?? null) : null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Seguridad y roles</h1>
        <p className="text-sm text-ink-soft">
          Crea aquí las cuentas de administradores y docentes. A cada docente
          se le asigna su sede y las asignaturas que dicta: queda como docente
          predeterminado de esas asignaturas y se propone solo al armar los
          cursos de un grupo. Los alumnos se gestionan en{" "}
          <Link href="/estudiantes" className="underline">
            Estudiantes y matrículas
          </Link>
          .
        </p>
      </div>

      <NuevoUsuarioForm sedes={listaSedes} asignaturas={opcionesAsignaturas} />

      <div className="overflow-x-auto surface-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-soft">
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">DNI</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Sede</th>
              <th className="px-4 py-3 font-medium">Asignaturas que dicta</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((u) => (
              <tr key={u.id} className="border-b border-line align-top last:border-0">
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
                <td className="px-4 py-3">
                  {u.rol === "docente" ? (
                    <AsignaturasDocente
                      key={`${u.id}-${u.sedeId ?? "sin"}`}
                      docenteId={u.id}
                      sedeId={u.sedeId}
                      asignaturas={opcionesAsignaturas}
                    />
                  ) : (
                    <span className="text-xs text-ink-soft">—</span>
                  )}
                </td>
              </tr>
            ))}
            {!lista.length && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-soft">
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
