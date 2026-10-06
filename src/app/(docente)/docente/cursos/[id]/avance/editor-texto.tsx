"use client";

import { useEffect, useRef, useState } from "react";
import { extraerIdYoutube, textoAHtml } from "@/lib/formato-texto";

const boton =
  "flex items-center justify-center rounded-md border border-line px-2.5 py-1.5 text-xs font-medium text-ink-soft transition hover:border-brand-blue hover:text-brand-blue";
const separador = "mx-0.5 h-5 w-px bg-line";

function IconoAlinear({ variante }: { variante: "izquierda" | "centro" | "derecha" | "justificar" }) {
  const lineas: Record<string, string[]> = {
    izquierda: ["0,1,14,1", "0,5,10,5", "0,9,14,9", "0,13,10,13"],
    centro: ["1,1,13,1", "2,5,12,5", "1,9,13,9", "2,13,12,13"],
    derecha: ["0,1,14,1", "4,5,14,5", "0,9,14,9", "4,13,14,13"],
    justificar: ["0,1,14,1", "0,5,14,5", "0,9,14,9", "0,13,14,13"],
  };
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      {lineas[variante].map((pts, i) => {
        const [x1, y1, x2] = pts.split(",").map(Number);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y1} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        );
      })}
    </svg>
  );
}

function IconoImagen() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="shrink-0">
      <rect x="2" y="3" width="16" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="7" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 14l4.5-4.5L11 13l2.5-2.5L17 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconoClip() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="shrink-0">
      <path
        d="M14.5 6.5l-6 6a2.5 2.5 0 103.5 3.5l6.5-6.5a4.5 4.5 0 10-6.5-6.5l-6.5 6.5a6.5 6.5 0 109 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatearTamano(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type AdjuntoExistente = { id: string; nombre: string; tipo: "imagen" | "archivo"; url: string };

type Popover = "enlace" | "youtube" | null;

// Arma un FileList a partir de un array de File para asignarlo a un
// <input type="file">: es la única forma de que esos archivos viajen en el
// FormData del submit, ya que no se insertan dentro del contentEditable.
function listaArchivos(files: File[]): FileList {
  const dt = new DataTransfer();
  files.forEach((f) => dt.items.add(f));
  return dt.files;
}

export function EditorDescripcion({
  name,
  defaultValue = "",
  adjuntosExistentes = [],
  nombreImagenes = "imagenes",
  nombreArchivos = "archivos",
  nombreEliminarAdjuntos = "eliminar_adjuntos",
}: {
  name: string;
  defaultValue?: string;
  adjuntosExistentes?: AdjuntoExistente[];
  nombreImagenes?: string;
  nombreArchivos?: string;
  nombreEliminarAdjuntos?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputImagenesRef = useRef<HTMLInputElement>(null);
  const inputArchivosRef = useRef<HTMLInputElement>(null);
  const seleccionarImagenRef = useRef<HTMLInputElement>(null);
  const seleccionarArchivoRef = useRef<HTMLInputElement>(null);
  const rangoGuardado = useRef<Range | null>(null);

  const [popover, setPopover] = useState<Popover>(null);
  const [valorPopover, setValorPopover] = useState("");
  const [errorPopover, setErrorPopover] = useState<string | null>(null);
  const [imagenesNuevas, setImagenesNuevas] = useState<File[]>([]);
  const [archivosNuevos, setArchivosNuevos] = useState<File[]>([]);
  const [adjuntosAEliminar, setAdjuntosAEliminar] = useState<string[]>([]);

  useEffect(() => {
    if (inputImagenesRef.current) inputImagenesRef.current.files = listaArchivos(imagenesNuevas);
  }, [imagenesNuevas]);
  useEffect(() => {
    if (inputArchivosRef.current) inputArchivosRef.current.files = listaArchivos(archivosNuevos);
  }, [archivosNuevos]);

  function sincronizar() {
    if (editorRef.current && inputRef.current) {
      inputRef.current.value = serializarEditor(editorRef.current);
    }
  }

  function guardarSeleccion() {
    const sel = window.getSelection();
    rangoGuardado.current = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
  }

  function restaurarSeleccion() {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && rangoGuardado.current) {
      sel.removeAllRanges();
      sel.addRange(rangoGuardado.current);
    }
  }

  function abrirPopover(tipo: Popover) {
    guardarSeleccion();
    setValorPopover("");
    setErrorPopover(null);
    setPopover(tipo);
  }

  function cerrarPopover() {
    setPopover(null);
    setValorPopover("");
    setErrorPopover(null);
  }

  function confirmarEnlace() {
    const url = valorPopover.trim();
    if (!/^(https?:|mailto:)/i.test(url)) {
      setErrorPopover("El enlace debe empezar con http://, https:// o mailto:.");
      return;
    }
    restaurarSeleccion();
    document.execCommand("createLink", false, url);
    sincronizar();
    cerrarPopover();
  }

  function insertarBloqueNoEditable(wrapper: HTMLElement) {
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      range.collapse(false);

      const brAntes = document.createElement("br");
      range.insertNode(brAntes);
      range.setStartAfter(brAntes);
      range.setEndAfter(brAntes);

      range.insertNode(wrapper);
      range.setStartAfter(wrapper);
      range.setEndAfter(wrapper);

      const brDespues = document.createElement("br");
      range.insertNode(brDespues);
      range.setStartAfter(brDespues);
      range.setEndAfter(brDespues);

      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      editorRef.current?.append(document.createElement("br"), wrapper, document.createElement("br"));
    }
    sincronizar();
  }

  function confirmarYoutube() {
    const url = valorPopover.trim();
    const videoId = extraerIdYoutube(url);
    if (!videoId) {
      setErrorPopover("No reconocemos ese enlace como un video de YouTube.");
      return;
    }
    restaurarSeleccion();

    const wrapper = document.createElement("div");
    wrapper.contentEditable = "false";
    wrapper.dataset.youtubeUrl = url;
    wrapper.className = "my-2 aspect-video w-full max-w-sm overflow-hidden rounded-md border border-line";
    wrapper.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}" title="Vista previa de YouTube" allowfullscreen class="h-full w-full"></iframe>`;

    insertarBloqueNoEditable(wrapper);
    cerrarPopover();
  }

  function comando(nombre: string) {
    editorRef.current?.focus();
    document.execCommand(nombre);
    sincronizar();
  }

  function alinear(valor: "justifyLeft" | "justifyCenter" | "justifyRight" | "justifyFull") {
    editorRef.current?.focus();
    document.execCommand(valor);
    sincronizar();
  }

  function neutralizarFormatoAmbiental() {
    const el = editorRef.current;
    if (!el || el.textContent?.trim()) return;
    if (document.activeElement !== el) return;
    if (document.queryCommandState("bold")) document.execCommand("bold");
    if (document.queryCommandState("italic")) document.execCommand("italic");
    if (document.queryCommandState("underline")) document.execCommand("underline");
  }

  function alEnfocar() {
    neutralizarFormatoAmbiental();
    requestAnimationFrame(neutralizarFormatoAmbiental);
  }

  // Red de seguridad determinista: "beforeinput" corre en la misma tarea,
  // justo antes de que el navegador inserte el carácter — a diferencia del
  // rAF de alEnfocar, no hay ventana de tiempo en la que el bug pueda
  // colarse si el usuario escribe muy rápido justo después de enfocar.
  function alEscribirAntes() {
    neutralizarFormatoAmbiental();
  }

  function elegirImagenes(lista: FileList | null) {
    if (!lista || !lista.length) return;
    const archivos = Array.from(lista).filter((f) => f.type.startsWith("image/"));
    setImagenesNuevas((prev) => [...prev, ...archivos]);
    if (seleccionarImagenRef.current) seleccionarImagenRef.current.value = "";
  }

  function elegirArchivos(lista: FileList | null) {
    if (!lista || !lista.length) return;
    setArchivosNuevos((prev) => [...prev, ...Array.from(lista)]);
    if (seleccionarArchivoRef.current) seleccionarArchivoRef.current.value = "";
  }

  const evitarPerderSeleccion = (e: React.MouseEvent) => e.preventDefault();

  const hayAdjuntos =
    imagenesNuevas.length > 0 ||
    archivosNuevos.length > 0 ||
    adjuntosExistentes.some((a) => !adjuntosAEliminar.includes(a.id));

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1 rounded-md border border-line bg-surface p-1">
        <button type="button" onMouseDown={evitarPerderSeleccion} onClick={() => comando("bold")} className={`${boton} font-bold`} title="Negrita">
          N
        </button>
        <button type="button" onMouseDown={evitarPerderSeleccion} onClick={() => comando("italic")} className={`${boton} italic`} title="Cursiva">
          C
        </button>
        <button type="button" onMouseDown={evitarPerderSeleccion} onClick={() => comando("underline")} className={`${boton} underline`} title="Subrayado">
          S
        </button>

        <span className={separador} />

        <button type="button" onMouseDown={evitarPerderSeleccion} onClick={() => alinear("justifyLeft")} className={boton} title="Alinear a la izquierda">
          <IconoAlinear variante="izquierda" />
        </button>
        <button type="button" onMouseDown={evitarPerderSeleccion} onClick={() => alinear("justifyCenter")} className={boton} title="Centrar">
          <IconoAlinear variante="centro" />
        </button>
        <button type="button" onMouseDown={evitarPerderSeleccion} onClick={() => alinear("justifyRight")} className={boton} title="Alinear a la derecha">
          <IconoAlinear variante="derecha" />
        </button>
        <button type="button" onMouseDown={evitarPerderSeleccion} onClick={() => alinear("justifyFull")} className={boton} title="Justificar">
          <IconoAlinear variante="justificar" />
        </button>

        <span className={separador} />

        <button type="button" onMouseDown={evitarPerderSeleccion} onClick={() => comando("insertUnorderedList")} className={boton} title="Lista">
          • Lista
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            evitarPerderSeleccion(e);
            abrirPopover("enlace");
          }}
          className={boton}
          title="Insertar enlace"
        >
          🔗 Enlace
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            evitarPerderSeleccion(e);
            abrirPopover("youtube");
          }}
          className={boton}
          title="Insertar video de YouTube"
        >
          ▶ YouTube
        </button>

        <span className={separador} />

        <button
          type="button"
          onClick={() => seleccionarImagenRef.current?.click()}
          className={boton}
          title="Adjuntar imagen"
        >
          <IconoImagen />
        </button>
        <button
          type="button"
          onClick={() => seleccionarArchivoRef.current?.click()}
          className={boton}
          title="Adjuntar archivo"
        >
          <IconoClip />
        </button>
      </div>

      <input
        ref={seleccionarImagenRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => elegirImagenes(e.target.files)}
      />
      <input
        ref={seleccionarArchivoRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => elegirArchivos(e.target.files)}
      />

      {popover && (
        <div className="flex flex-col gap-1.5 rounded-md border border-line bg-bg p-2.5">
          <div className="flex items-center gap-2">
            <input
              type="text"
              autoFocus
              value={valorPopover}
              onChange={(e) => setValorPopover(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                if (popover === "enlace") confirmarEnlace();
                else confirmarYoutube();
              }}
              placeholder={popover === "enlace" ? "https://…" : "https://www.youtube.com/watch?v=…"}
              className="flex-1 rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-brand-blue"
            />
            <button
              type="button"
              onClick={popover === "enlace" ? confirmarEnlace : confirmarYoutube}
              className="rounded-md bg-brand-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-blue"
            >
              Insertar
            </button>
            <button type="button" onClick={cerrarPopover} className="rounded-md border border-line px-3 py-1.5 text-xs text-ink-soft hover:bg-surface">
              Cancelar
            </button>
          </div>
          {errorPopover && <p className="text-xs text-danger">{errorPopover}</p>}
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        onFocus={alEnfocar}
        onBeforeInput={alEscribirAntes}
        onInput={sincronizar}
        suppressContentEditableWarning
        dangerouslySetInnerHTML={defaultValue ? { __html: textoAHtml(defaultValue) } : undefined}
        data-placeholder="Ej. Se resolvieron ejercicios de práctica, con el video de la clase."
        className="min-h-[88px] rounded-md border border-line bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue-light/40 empty:before:text-ink-soft empty:before:content-[attr(data-placeholder)] [&_a]:text-brand-blue [&_a]:underline"
      />
      <input ref={inputRef} type="hidden" name={name} defaultValue={defaultValue} />
      <input ref={inputImagenesRef} type="file" name={nombreImagenes} multiple className="hidden" />
      <input ref={inputArchivosRef} type="file" name={nombreArchivos} multiple className="hidden" />
      {adjuntosAEliminar.map((id) => (
        <input key={id} type="hidden" name={nombreEliminarAdjuntos} value={id} />
      ))}

      {hayAdjuntos && (
        <div className="flex flex-wrap gap-2 rounded-md border border-line bg-bg p-2">
          {adjuntosExistentes
            .filter((a) => !adjuntosAEliminar.includes(a.id))
            .map((a) => (
              <div key={a.id} className="group relative">
                {a.tipo === "imagen" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.url} alt={a.nombre} className="h-16 w-16 rounded-md border border-line object-cover" />
                ) : (
                  <div className="flex h-16 w-24 flex-col items-center justify-center gap-1 rounded-md border border-line px-2 text-center">
                    <IconoClip />
                    <span className="line-clamp-1 text-[0.65rem] text-ink-soft">{a.nombre}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setAdjuntosAEliminar((prev) => [...prev, a.id])}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-xs text-white shadow"
                  title="Quitar adjunto"
                >
                  ✕
                </button>
              </div>
            ))}

          {imagenesNuevas.map((f, i) => (
            <div key={`img-${i}`} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={URL.createObjectURL(f)} alt={f.name} className="h-16 w-16 rounded-md border border-line object-cover" />
              <button
                type="button"
                onClick={() => setImagenesNuevas((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-xs text-white shadow"
                title="Quitar"
              >
                ✕
              </button>
            </div>
          ))}

          {archivosNuevos.map((f, i) => (
            <div key={`arch-${i}`} className="group relative">
              <div className="flex h-16 w-24 flex-col items-center justify-center gap-1 rounded-md border border-line px-2 text-center">
                <IconoClip />
                <span className="line-clamp-1 text-[0.65rem] text-ink-soft">{f.name}</span>
                <span className="font-mono-tab text-[0.6rem] text-ink-soft">{formatearTamano(f.size)}</span>
              </div>
              <button
                type="button"
                onClick={() => setArchivosNuevos((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-xs text-white shadow"
                title="Quitar"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-ink-soft">
        Usa la barra para dar formato, alinear texto o adjuntar imágenes y archivos.
      </p>
    </div>
  );
}

// Serializa el DOM del editor a nuestro formato de texto plano (el mismo
// que entiende renderTextoConFormato): **negrita**, *cursiva*, __subrayado__,
// [texto](url), líneas "- " para listas, prefijo ">center>"/">right>"/
// ">justify>" para alineación, y la URL sola en su línea para los videos de
// YouTube insertados. Nunca se guarda HTML — así no hace falta sanitizar
// nada en el servidor ni al mostrarlo después.
function serializar(nodo: Node): string {
  if (nodo.nodeType === Node.TEXT_NODE) return nodo.textContent ?? "";

  if (!(nodo instanceof HTMLElement)) return "";

  if (nodo.dataset.youtubeUrl) return nodo.dataset.youtubeUrl + "\n";

  const hijos = Array.from(nodo.childNodes).map(serializar).join("");

  switch (nodo.tagName) {
    case "STRONG":
    case "B":
      return hijos.trim() ? `**${hijos}**` : "";
    case "EM":
    case "I":
      return hijos.trim() ? `*${hijos}*` : "";
    case "U":
      return hijos.trim() ? `__${hijos}__` : "";
    case "A": {
      const href = nodo.getAttribute("href") ?? "";
      return hijos.trim() && href ? `[${hijos}](${href})` : hijos;
    }
    case "LI":
      return `- ${hijos}\n`;
    case "UL":
    case "OL":
      return hijos;
    case "DIV":
    case "P": {
      const alineacion = nodo.style.textAlign;
      const prefijo = alineacion === "center" ? ">center>" : alineacion === "right" ? ">right>" : alineacion === "justify" ? ">justify>" : "";
      return hijos.trim() ? prefijo + hijos + "\n" : hijos + "\n";
    }
    case "BR":
      return "\n";
    default:
      return hijos;
  }
}

function serializarEditor(el: HTMLElement): string {
  const crudo = Array.from(el.childNodes).map(serializar).join("");
  return crudo.replace(/\n{3,}/g, "\n\n").replace(/[ \t]+\n/g, "\n").trim();
}
