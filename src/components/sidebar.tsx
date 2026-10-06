"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "./nav-items";
import { NavIcon } from "./nav-icon";
import { SidebarShell } from "./sidebar-shell";

const fases = [
  { n: 1 as const, titulo: "Administración" },
  { n: 2 as const, titulo: "Académico" },
  { n: 3 as const, titulo: "Reportes" },
];

export function Sidebar({ colapsado }: { colapsado: boolean }) {
  const pathname = usePathname();
  const [grupoAbierto, setGrupoAbierto] = useState<number | null>(
    () => fases.find((f) => navItems.some((i) => i.fase === f.n && pathname.startsWith(i.href)))?.n ?? null
  );

  const alternarGrupo = (n: number) => setGrupoAbierto((prev) => (prev === n ? null : n));

  return (
    <SidebarShell colapsado={colapsado} logoHref="/dashboard">
      <nav className={`flex flex-1 flex-col gap-5 overflow-y-auto pb-6 ${colapsado ? "items-center px-2" : "px-4"}`}>
        {fases.map((fase) => {
          const abierto = colapsado || grupoAbierto === fase.n;
          return (
            <div key={fase.n} className="flex w-full flex-col gap-1">
              {!colapsado && (
                <button
                  type="button"
                  onClick={() => alternarGrupo(fase.n)}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-left transition-colors hover:bg-white/5"
                >
                  <span className="font-mono-tab text-[0.68rem] font-bold uppercase tracking-wider text-white/60">
                    {fase.titulo}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-3 w-3 text-white/40 transition-transform duration-200 ${
                      abierto ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              )}
              {!colapsado && <div className="mb-1 h-px bg-gradient-to-r from-white/15 to-transparent" />}
              {colapsado && <div className="mx-auto mb-1 h-px w-6 bg-white/15" />}
              {abierto &&
                navItems
                  .filter((i) => i.fase === fase.n)
                  .map((i) => {
                    const activo = pathname.startsWith(i.href);
                    if (!i.listo) {
                      return (
                        <span
                          key={i.href}
                          title={colapsado ? i.nombre : undefined}
                          className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white/35 ${
                            colapsado ? "justify-center" : ""
                          }`}
                        >
                          <NavIcon name={i.icono} className="h-4 w-4 shrink-0" />
                          {!colapsado && i.nombre}
                        </span>
                      );
                    }
                    return (
                      <Link
                        key={i.href}
                        href={i.href}
                        title={colapsado ? i.nombre : undefined}
                        className={`group relative flex animate-float-in items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-all duration-200 ${
                          colapsado ? "justify-center" : ""
                        } ${
                          activo
                            ? "bg-gradient-to-r from-brand-blue to-brand-blue-light text-white shadow-[0_2px_10px_-2px_rgba(92,133,230,0.6)] before:absolute before:-left-4 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-white"
                            : "text-white/80 hover:translate-x-0.5 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <NavIcon name={i.icono} className="icono-animado h-4 w-4 shrink-0 group-hover:text-white" />
                        {!colapsado && i.nombre}
                      </Link>
                    );
                  })}
            </div>
          );
        })}
      </nav>
    </SidebarShell>
  );
}
