"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { GrupoConCursos, CursoNav } from "@/lib/docente-nav";
import { NavIcon } from "@/components/nav-icon";
import { SidebarShell } from "@/components/sidebar-shell";

function NavLink({
  href,
  exact = false,
  small = false,
  icono,
  colapsado,
  children,
}: {
  href: string;
  exact?: boolean;
  small?: boolean;
  icono?: string;
  colapsado?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activo = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      title={colapsado ? (typeof children === "string" ? children : undefined) : undefined}
      className={`flex items-center gap-2 rounded-md py-1.5 transition ${
        colapsado ? "justify-center px-2" : small ? "ml-3 px-2 text-xs text-white/60" : "px-2 text-sm text-white/80"
      } ${activo ? "bg-white/15 text-white" : "hover:bg-white/10 hover:text-white"}`}
    >
      {icono && <NavIcon name={icono} className="h-4 w-4 shrink-0" />}
      {!colapsado && children}
    </Link>
  );
}

function AvanceLinks({ cursos, colapsado }: { cursos: CursoNav[]; colapsado: boolean }) {
  if (colapsado) return null;
  if (cursos.length === 1) {
    return (
      <NavLink href={`/docente/cursos/${cursos[0].cursoId}/avance`} small>
        Avance
      </NavLink>
    );
  }
  return (
    <>
      {cursos.map((c) => (
        <NavLink key={c.cursoId} href={`/docente/cursos/${c.cursoId}/avance`} small>
          Avance · {c.asignaturaNombre}
        </NavLink>
      ))}
    </>
  );
}

export function DocenteSidebar({
  colapsado,
  grupos,
  cursosSinGrupo,
}: {
  colapsado: boolean;
  grupos: GrupoConCursos[];
  cursosSinGrupo: CursoNav[];
}) {
  return (
    <SidebarShell colapsado={colapsado} logoHref="/docente">
      <nav className={`flex flex-1 flex-col gap-1 overflow-y-auto pb-6 ${colapsado ? "items-center px-2" : "px-4"}`}>
        <NavLink href="/docente" exact icono="grupos" colapsado={colapsado}>
          Grupos Académicos
        </NavLink>

        {!colapsado && (
          <div className="mt-1 flex flex-col gap-3">
            {grupos.map((g) => (
              <div key={g.grupoId} className="flex flex-col gap-1">
                <Link
                  href={`/docente/grupos/${g.grupoId}`}
                  className="px-2 text-sm text-white/80 transition hover:text-white"
                >
                  {g.grupoNombre}
                </Link>
                <AvanceLinks cursos={g.cursos} colapsado={colapsado} />
              </div>
            ))}

            {cursosSinGrupo.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="px-2 font-mono-tab text-[0.68rem] uppercase tracking-wider text-white/45">
                  Sin grupo
                </span>
                <AvanceLinks cursos={cursosSinGrupo} colapsado={colapsado} />
              </div>
            )}
          </div>
        )}
      </nav>
    </SidebarShell>
  );
}
