"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { navItems } from "./nav-items";

const fases = [
  { n: 1 as const, titulo: "Núcleo administrativo" },
  { n: 2 as const, titulo: "Vida académica" },
  { n: 3 as const, titulo: "Portal y reportes" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col gap-6 border-r border-line bg-brand-navy px-4 py-6 text-white">
      <Link href="/dashboard" className="flex items-center gap-3 px-2">
        <Image
          src="/brand/logo-laplace.png"
          alt=""
          width={36}
          height={36}
          className="shrink-0"
        />
        <span className="text-sm font-semibold leading-tight">
          SGA
          <br />
          <span className="text-white/60">Academia Laplace</span>
        </span>
      </Link>

      <nav className="flex flex-col gap-5 overflow-y-auto">
        {fases.map((fase) => (
          <div key={fase.n} className="flex flex-col gap-1">
            <span className="px-2 font-mono-tab text-[0.68rem] uppercase tracking-wider text-white/45">
              Fase {fase.n} · {fase.titulo}
            </span>
            {navItems
              .filter((i) => i.fase === fase.n)
              .map((i) => {
                const activo = pathname.startsWith(i.href);
                if (!i.listo) {
                  return (
                    <span
                      key={i.href}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white/35"
                      title="Próximamente"
                    >
                      <span className="font-mono-tab text-xs">{i.item}</span>
                      {i.nombre}
                    </span>
                  );
                }
                return (
                  <Link
                    key={i.href}
                    href={i.href}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition ${
                      activo
                        ? "bg-white/15 text-white"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="font-mono-tab text-xs text-white/50">
                      {i.item}
                    </span>
                    {i.nombre}
                  </Link>
                );
              })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
