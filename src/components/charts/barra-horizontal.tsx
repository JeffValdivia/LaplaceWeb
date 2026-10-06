export type ItemBarra = {
  label: string;
  value: number;
  colorHex: string;
  sublabel?: string;
};

export function BarraHorizontal({
  items,
  sufijo = "",
}: {
  items: ItemBarra[];
  sufijo?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));

  if (!items.length) {
    return <p className="text-sm italic text-ink-soft">Sin datos todavía.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((i, idx) => (
        <li key={i.label} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-medium text-ink">{i.label}</span>
            <span className="font-mono-tab text-ink-soft">
              {i.value}
              {sufijo}
              {i.sublabel ? (
                <span className="ml-1.5 text-xs text-ink-soft/70">{i.sublabel}</span>
              ) : null}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-line">
            <div
              className="animar-barra-x h-full rounded-full"
              style={{
                width: `${(i.value / max) * 100}%`,
                backgroundColor: i.colorHex,
                animationDelay: `${idx * 70}ms`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
