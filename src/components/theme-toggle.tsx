"use client";

import { useEffect, useState } from "react";

function SolIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </svg>
  );
}

function LunaIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    </svg>
  );
}

export function ThemeToggle({
  colapsado = false,
  variant = "sidebar",
}: {
  colapsado?: boolean;
  variant?: "sidebar" | "header";
}) {
  const [oscuro, setOscuro] = useState(false);

  useEffect(() => {
    setOscuro(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  function alternar() {
    const nuevo = oscuro ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nuevo);
    try {
      localStorage.setItem("tema", nuevo);
    } catch {
      // localStorage inaccesible (modo privado, etc.) — el cambio sigue
      // aplicando para esta sesión, solo no se recuerda la próxima vez.
    }
    setOscuro(!oscuro);
  }

  if (variant === "header") {
    return (
      <button
        type="button"
        onClick={alternar}
        title={oscuro ? "Modo claro" : "Modo noche"}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink-soft transition-all duration-200 hover:border-brand-blue hover:text-brand-blue"
      >
        {oscuro ? <SolIcon className="h-4 w-4" /> : <LunaIcon className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={alternar}
      title={oscuro ? "Modo claro" : "Modo noche"}
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white/80 transition-all duration-200 hover:bg-white/10 hover:text-white ${
        colapsado ? "justify-center" : ""
      }`}
    >
      {oscuro ? <SolIcon className="h-4 w-4 shrink-0" /> : <LunaIcon className="h-4 w-4 shrink-0" />}
      {!colapsado && (oscuro ? "Modo claro" : "Modo noche")}
    </button>
  );
}
