"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import { ThemeToggle } from "./theme-toggle";

export function SidebarShell({
  colapsado,
  logoHref,
  children,
}: {
  colapsado: boolean;
  logoHref: string;
  children: ReactNode;
}) {
  return (
    <aside
      className={`sticky top-3 m-3 flex h-[calc(100vh-1.5rem)] shrink-0 flex-col gap-6 self-start overflow-y-auto rounded-2xl bg-gradient-to-b from-[#0f1642] via-brand-navy to-[#1b2a6e] text-white shadow-[0_12px_32px_-8px_rgba(15,22,66,0.45)] transition-[width] duration-300 ${
        colapsado ? "w-20" : "w-64"
      }`}
    >
      <div className="relative overflow-hidden rounded-t-2xl bg-white pb-7 pt-5">
        <Link href={logoHref} className="relative z-10 flex flex-col items-center gap-1.5">
          {colapsado ? (
            <Image src="/brand/filosofo.png" alt="Academia Pierre Laplace" width={44} height={44} priority />
          ) : (
            <>
              <span className="font-display text-base font-bold leading-tight tracking-normal text-brand-blue text-center">
                Academia
                <br />
                Pierre Laplace
                <br />
                Aula Virtual
              </span>
              <Image src="/brand/filosofo.png" alt="Academia Pierre Laplace" width={150} height={150} priority />
              <span className="font-display text-sm italic text-ink-soft">
                Contigo hasta tu ingreso
              </span>
            </>
          )}
        </Link>
        <svg
          viewBox="0 0 400 40"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 h-6 w-full"
          aria-hidden="true"
        >
          <path d="M0,22 C80,2 160,38 240,20 C300,6 340,26 400,14 L400,40 L0,40 Z" fill="var(--brand-navy)" />
        </svg>
      </div>

      {children}

      <div className={`border-t border-white/10 py-3 ${colapsado ? "px-2" : "px-4"}`}>
        <ThemeToggle colapsado={colapsado} />
      </div>
    </aside>
  );
}
