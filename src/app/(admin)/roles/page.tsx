import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { usuarios } from "@/lib/db/schema";
import { NuevoUsuarioForm } from "./form";
import { RolSelect } from "./rol-select";

export default async function RolesPage() {
  const lista = await db
    .select({ id: usuarios.id, nombreCompleto: usuarios.nombreCompleto, email: usuarios.email, rol: usuarios.rol })
    .from(usuarios)
    .orderBy(asc(usuarios.nombreCompleto));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Seguridad y roles</h1>
        <p className="text-sm text-ink-soft">
          Crea aquí mismo las cuentas de otros administradores o docentes — no
          hace falta ningún panel externo. Las cuentas de estudiante se crean
          solas cuando ellos se registran con su DNI (Fase 3).
        </p>
      </div>

      <NuevoUsuarioForm />

      <div className="overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-soft">
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Correo</th>
              <th className="px-4 py-3 font-medium">Rol</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{u.nombreCompleto}</td>
                <td className="px-4 py-3 text-ink-soft">{u.email}</td>
                <td className="px-4 py-3">
                  <RolSelect id={u.id} rolActual={u.rol} />
                </td>
              </tr>
            ))}
            {!lista.length && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-ink-soft">
                  Todavía no hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
