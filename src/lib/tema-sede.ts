export type TemaSede = { tarjeta: string; conteo: string };

// Color institucional por sede, como valor hex plano — para usar en
// gráficos (SVG/estilos inline) donde no sirven las clases de Tailwind.
export const hexPorSede: Record<string, string> = {
  UCSM: "#0cd85d",
  UNSA: "#64001d",
};

// Tema visual por sede: cada una resalta con su color institucional.
export const temaPorSede: Record<string, TemaSede> = {
  UCSM: {
    tarjeta:
      "border-[#0cd85d]/40 hover:border-[#0cd85d] hover:-translate-y-0.5 hover:bg-[#0cd85d]/10 hover:shadow-[0_0_18px_-4px_#0cd85d]",
    conteo: "text-[#0cd85d]",
  },
  UNSA: {
    tarjeta:
      "border-[#64001d]/40 hover:border-[#64001d] hover:-translate-y-0.5 hover:bg-[#64001d]/10 hover:shadow-[0_0_18px_-4px_#64001d]",
    conteo: "text-[#64001d]",
  },
};
