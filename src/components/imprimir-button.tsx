"use client";

export function ImprimirButton({ texto = "Imprimir / Guardar como PDF" }: { texto?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md bg-gradient-to-r from-brand-navy to-brand-blue px-4 py-2 text-sm font-medium text-white hover:brightness-110 hover:shadow-lg transition-all duration-200"
    >
      {texto}
    </button>
  );
}
