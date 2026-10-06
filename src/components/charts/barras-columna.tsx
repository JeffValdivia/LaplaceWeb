export type PuntoColumna = { label: string; value: number };

export function BarrasColumna({
  puntos,
  colorHex = "#2c4bb0",
  alturaMax = 110,
}: {
  puntos: PuntoColumna[];
  colorHex?: string;
  alturaMax?: number;
}) {
  const max = Math.max(1, ...puntos.map((p) => p.value));

  return (
    <div className="flex items-end gap-3" style={{ height: alturaMax + 40 }}>
      {puntos.map((p, idx) => (
        <div
          key={p.label}
          className="flex flex-1 flex-col items-center justify-end gap-1.5"
          style={{ height: alturaMax + 40 }}
        >
          <span className="font-mono-tab text-xs text-ink-soft">{p.value}</span>
          <div
            className="animar-barra-y w-full max-w-10 rounded-t-md"
            style={{
              height: p.value ? Math.max(4, (p.value / max) * alturaMax) : 2,
              backgroundColor: colorHex,
              animationDelay: `${idx * 70}ms`,
            }}
          />
          <span className="text-[0.68rem] uppercase tracking-wide text-ink-soft">{p.label}</span>
        </div>
      ))}
    </div>
  );
}
