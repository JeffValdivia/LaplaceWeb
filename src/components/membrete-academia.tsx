import Image from "next/image";

export function MembreteAcademia({ subtitulo }: { subtitulo: string }) {
  return (
    <header className="flex items-center gap-4 border-b-2 border-ink pb-4">
      <Image src="/brand/log-laplace.png" alt="" width={64} height={64} className="shrink-0" />
      <div>
        <h1 className="text-xl font-bold uppercase tracking-wide text-ink">Academia Pierre Laplace</h1>
        <p className="text-sm text-ink-soft">{subtitulo}</p>
      </div>
    </header>
  );
}
