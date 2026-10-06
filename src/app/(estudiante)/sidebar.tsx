"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon } from "@/components/nav-icon";
import { SidebarShell } from "@/components/sidebar-shell";

const enlaces = [
  { href: "/portal", label: "Inicio", icono: "dashboard", exact: true },
  { href: "/portal/calendario", label: "Calendario", icono: "eventos" },
  { href: "/portal/recursos", label: "Campus virtual", icono: "asignaturas" },
  { href: "/portal/evaluaciones", label: "Evaluaciones", icono: "evaluaciones" },
  { href: "/portal/evaluacion-docente", label: "Evaluar docentes", icono: "evaluaciones" },
  { href: "/portal/asistencia", label: "Asistencia", icono: "asistencia" },
  { href: "/portal/comunicados", label: "Comunicados", icono: "notificaciones" },
];

export function EstudianteSidebar({
  colapsado,
  bloqueado,
}: {
  colapsado: boolean;
  bloqueado: boolean;
}) {
  const pathname = usePathname();

  return (
    <SidebarShell colapsado={colapsado} logoHref="/portal">
      <nav className={`flex flex-1 flex-col gap-1 overflow-y-auto pb-6 ${colapsado ? "items-center px-2" : "px-4"}`}>
        {!colapsado && (
          <span className="mb-1 px-2 font-mono-tab text-[0.68rem] font-bold uppercase tracking-wider text-white/60">
            Portal del estudiante
          </span>
        )}
        {!bloqueado &&
          enlaces.map((e) => {
            const activo = e.exact
              ? pathname === e.href
              : pathname === e.href || pathname.startsWith(`${e.href}/`);
            return (
              <Link
                key={e.href}
                href={e.href}
                title={colapsado ? e.label : undefined}
                className={`group relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-all duration-200 ${
                  colapsado ? "justify-center" : ""
                } ${
                  activo
                    ? "bg-gradient-to-r from-brand-blue to-brand-blue-light text-white shadow-[0_2px_10px_-2px_rgba(92,133,230,0.6)]"
                    : "text-white/80 hover:translate-x-0.5 hover:bg-white/10 hover:text-white"
                }`}
              >
                <NavIcon name={e.icono} className="icono-animado h-4 w-4 shrink-0 group-hover:text-white" />
                {!colapsado && e.label}
              </Link>
            );
          })}
        {bloqueado && !colapsado && (
          <p className="px-2 text-xs italic text-white/50">Acceso restringido — matrícula no activa.</p>
        )}
      </nav>
    </SidebarShell>
  );
}
