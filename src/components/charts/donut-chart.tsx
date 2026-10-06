export type SegmentoDonut = { label: string; value: number; colorHex: string };

export function DonutChart({
  segmentos,
  size = 150,
  grosor = 22,
}: {
  segmentos: SegmentoDonut[];
  size?: number;
  grosor?: number;
}) {
  const total = segmentos.reduce((a, s) => a + s.value, 0);
  const radio = (size - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  let acumulado = 0;

  return (
    <div className="flex items-center gap-6">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="animar-donut shrink-0"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radio}
          fill="none"
          stroke="var(--line)"
          strokeWidth={grosor}
        />
        {total > 0 &&
          segmentos.map((s) => {
            if (!s.value) return null;
            const largo = (s.value / total) * circunferencia;
            const dashoffset = -acumulado;
            acumulado += largo;
            return (
              <circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={radio}
                fill="none"
                stroke={s.colorHex}
                strokeWidth={grosor}
                strokeDasharray={`${largo} ${circunferencia - largo}`}
                strokeDashoffset={dashoffset}
              />
            );
          })}
      </svg>
      <ul className="flex flex-col gap-1.5 text-sm">
        {segmentos.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: s.colorHex }}
            />
            <span className="text-ink-soft">{s.label}</span>
            <span className="font-mono-tab font-medium text-ink">{s.value}</span>
            {total > 0 && (
              <span className="text-xs text-ink-soft">
                ({Math.round((s.value / total) * 100)}%)
              </span>
            )}
          </li>
        ))}
        {total === 0 && <li className="text-sm italic text-ink-soft">Sin datos todavía.</li>}
      </ul>
    </div>
  );
}
