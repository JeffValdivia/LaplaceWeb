import type { ReactNode } from "react";

// Subconjunto chico de Markdown para las observaciones del avance de clase:
// **negrita**, *cursiva*, __subrayado__, [texto](enlace), líneas "- " como
// lista y ">center>"/">right>"/">justify>" como prefijo de alineación. Se
// parsea a elementos de React directamente (nunca dangerouslySetInnerHTML),
// así que no hay riesgo de inyección por el texto en sí. Una línea que es
// solo un enlace de YouTube se embebe como reproductor en vez de mostrarse
// como texto — tanto al editar (editor-texto.tsx) como al mostrar lo guardado.
const PATRON_INLINE = /(\[[^\]]+\]\([^)\s]+\))|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(__[^_]+__)/g;
const PREFIJOS_ALINEACION: Record<string, string> = {
  ">center>": "center",
  ">right>": "right",
  ">justify>": "justify",
};

function esUrlSegura(url: string) {
  return /^(https?:|mailto:)/i.test(url);
}

function separarAlineacion(linea: string): { alineacion: string | null; resto: string } {
  for (const [prefijo, valor] of Object.entries(PREFIJOS_ALINEACION)) {
    if (linea.startsWith(prefijo)) return { alineacion: valor, resto: linea.slice(prefijo.length) };
  }
  return { alineacion: null, resto: linea };
}

// Soporta watch?v=, youtu.be/, embed/ y shorts/, con o sin parámetros extra.
export function extraerIdYoutube(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");
  if (host === "youtu.be") {
    return u.pathname.slice(1).split("/")[0] || null;
  }
  if (host === "youtube.com" || host === "m.youtube.com") {
    if (u.pathname === "/watch") return u.searchParams.get("v");
    if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2] || null;
    if (u.pathname.startsWith("/shorts/")) return u.pathname.split("/")[2] || null;
  }
  return null;
}

export function EmbedYoutube({ videoId }: { videoId: string }) {
  return (
    <div className="aspect-video w-full max-w-md overflow-hidden rounded-md border border-line">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="Vista previa de YouTube"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}

function renderLineaConEnfasis(linea: string, keyPrefix: string): ReactNode[] {
  const partes = linea.split(PATRON_INLINE).filter((p): p is string => Boolean(p));
  return partes.map((parte, i) => {
    const key = `${keyPrefix}-${i}`;
    const link = parte.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      const [, texto, url] = link;
      if (esUrlSegura(url)) {
        return (
          <a
            key={key}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-blue underline"
          >
            {texto}
          </a>
        );
      }
      return <span key={key}>{texto}</span>;
    }
    if (parte.startsWith("**") && parte.endsWith("**") && parte.length > 3) {
      return <strong key={key}>{parte.slice(2, -2)}</strong>;
    }
    if (parte.startsWith("__") && parte.endsWith("__") && parte.length > 3) {
      return <u key={key}>{parte.slice(2, -2)}</u>;
    }
    if (parte.startsWith("*") && parte.endsWith("*") && parte.length > 1) {
      return <em key={key}>{parte.slice(1, -1)}</em>;
    }
    return <span key={key}>{parte}</span>;
  });
}

const CLASE_ALINEACION: Record<string, string> = {
  center: "text-center",
  right: "text-right",
  justify: "text-justify",
};

export function renderTextoConFormato(texto: string): ReactNode {
  if (!texto.trim()) return null;

  const lineas = texto.split("\n");
  const bloques: ReactNode[] = [];
  let listaActual: string[] = [];

  const cerrarLista = (key: string) => {
    if (!listaActual.length) return;
    bloques.push(
      <ul key={key} className="ml-5 list-disc">
        {listaActual.map((item, i) => (
          <li key={i}>{renderLineaConEnfasis(item, `${key}-li-${i}`)}</li>
        ))}
      </ul>
    );
    listaActual = [];
  };

  lineas.forEach((linea, i) => {
    const videoId = extraerIdYoutube(linea.trim());
    if (videoId) {
      cerrarLista(`lista-${i}`);
      bloques.push(<EmbedYoutube key={`yt-${i}`} videoId={videoId} />);
      return;
    }
    if (linea.startsWith("- ")) {
      listaActual.push(linea.slice(2));
      return;
    }
    cerrarLista(`lista-${i}`);
    if (linea.trim()) {
      const { alineacion, resto } = separarAlineacion(linea);
      bloques.push(
        <p key={`p-${i}`} className={alineacion ? CLASE_ALINEACION[alineacion] : undefined}>
          {renderLineaConEnfasis(resto, `p-${i}`)}
        </p>
      );
    }
  });
  cerrarLista("lista-final");

  return <div className="flex flex-col gap-1.5">{bloques}</div>;
}

function escaparHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function lineaConEnfasisAHtml(linea: string): string {
  const partes = linea.split(PATRON_INLINE).filter((p): p is string => Boolean(p));
  return partes
    .map((parte) => {
      const link = parte.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
      if (link) {
        const [, texto, url] = link;
        if (esUrlSegura(url)) {
          return `<a href="${escaparHtml(url)}">${escaparHtml(texto)}</a>`;
        }
        return escaparHtml(texto);
      }
      if (parte.startsWith("**") && parte.endsWith("**") && parte.length > 3) {
        return `<strong>${escaparHtml(parte.slice(2, -2))}</strong>`;
      }
      if (parte.startsWith("__") && parte.endsWith("__") && parte.length > 3) {
        return `<u>${escaparHtml(parte.slice(2, -2))}</u>`;
      }
      if (parte.startsWith("*") && parte.endsWith("*") && parte.length > 1) {
        return `<em>${escaparHtml(parte.slice(1, -1))}</em>`;
      }
      return escaparHtml(parte);
    })
    .join("");
}

// Inverso de la serialización del editor (editor-texto.tsx): reconstruye el
// HTML inicial del contentEditable al editar un avance ya guardado. Todo el
// texto plano pasa por escaparHtml antes de insertarse, así que aunque el
// docente haya escrito literalmente "<script>" como observación, llega acá
// como texto, nunca como markup.
export function textoAHtml(texto: string): string {
  if (!texto.trim()) return "";

  const lineas = texto.split("\n");
  const bloques: string[] = [];
  let listaActual: string[] = [];

  const cerrarLista = () => {
    if (!listaActual.length) return;
    bloques.push(`<div><ul>${listaActual.map((item) => `<li>${lineaConEnfasisAHtml(item)}</li>`).join("")}</ul></div>`);
    listaActual = [];
  };

  for (const linea of lineas) {
    const videoId = extraerIdYoutube(linea.trim());
    if (videoId) {
      cerrarLista();
      const url = escaparHtml(linea.trim());
      bloques.push(
        `<div contenteditable="false" data-youtube-url="${url}" class="my-2 aspect-video w-full max-w-sm overflow-hidden rounded-md border border-line"><iframe src="https://www.youtube.com/embed/${videoId}" title="Vista previa de YouTube" allowfullscreen class="h-full w-full"></iframe></div>`
      );
      continue;
    }
    if (linea.startsWith("- ")) {
      listaActual.push(linea.slice(2));
      continue;
    }
    cerrarLista();
    if (linea.trim()) {
      const { alineacion, resto } = separarAlineacion(linea);
      const estilo = alineacion ? ` style="text-align:${alineacion}"` : "";
      bloques.push(`<div${estilo}>${lineaConEnfasisAHtml(resto)}</div>`);
    } else {
      bloques.push("<div><br></div>");
    }
  }
  cerrarLista();

  return bloques.join("");
}
