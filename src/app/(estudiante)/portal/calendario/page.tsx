import { redirect } from "next/navigation";
import { eq, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  evaluaciones,
  matriculas,
  cursos,
  asignaturas,
  comunicados,
  grupos,
  eventos as eventosTabla,
} from "@/lib/db/schema";
import { obtenerUsuarioActual } from "@/lib/auth/session";
import { CalendarioCliente, type EventoCalendario } from "./calendario-cliente";

function claveFecha(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default async function CalendarioPortalPage() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario?.estudianteId) redirect("/login");

  const misGrupos = await db
    .select({ grupoId: matriculas.grupoId })
    .from(matriculas)
    .where(eq(matriculas.estudianteId, usuario.estudianteId));
  const grupoIds = misGrupos.map((g) => g.grupoId).filter((id): id is string => id !== null);

  const [misCursos, misSedes] = await Promise.all([
    grupoIds.length
      ? db.select({ id: cursos.id }).from(cursos).where(inArray(cursos.grupoId, grupoIds))
      : [],
    grupoIds.length
      ? db.select({ sedeId: grupos.sedeId }).from(grupos).where(inArray(grupos.id, grupoIds))
      : [],
  ]);
  const cursoIds = misCursos.map((c) => c.id);
  const sedeIds = [...new Set(misSedes.map((s) => s.sedeId))];

  const condicionesPropias = [eq(eventosTabla.alcance, "academia")];
  if (sedeIds.length) condicionesPropias.push(inArray(eventosTabla.sedeId, sedeIds));
  if (grupoIds.length) condicionesPropias.push(inArray(eventosTabla.grupoId, grupoIds));

  const [listaEvaluaciones, listaComunicados, listaEventos] = await Promise.all([
    cursoIds.length
      ? db
          .select({
            id: evaluaciones.id,
            titulo: evaluaciones.titulo,
            disponibleDesde: evaluaciones.disponibleDesde,
            disponibleHasta: evaluaciones.disponibleHasta,
            asignaturaNombre: asignaturas.nombre,
          })
          .from(evaluaciones)
          .innerJoin(cursos, eq(cursos.id, evaluaciones.cursoId))
          .innerJoin(asignaturas, eq(asignaturas.id, cursos.asignaturaId))
          .where(inArray(evaluaciones.cursoId, cursoIds))
      : [],
    db
      .select()
      .from(comunicados)
      .where(
        grupoIds.length
          ? or(eq(comunicados.alcance, "academia"), inArray(comunicados.grupoId, grupoIds))
          : eq(comunicados.alcance, "academia")
      ),
    db
      .select()
      .from(eventosTabla)
      .where(or(...condicionesPropias)),
  ]);

  const eventos: EventoCalendario[] = [];

  for (const ev of listaEvaluaciones) {
    if (ev.disponibleDesde) {
      eventos.push({
        id: `examen-inicio-${ev.id}`,
        fecha: claveFecha(ev.disponibleDesde),
        tipo: "examen",
        titulo: `${ev.asignaturaNombre}: ${ev.titulo}`,
        subtitulo: "Se habilita",
        href: `/portal/evaluaciones/${ev.id}`,
      });
    }
    if (ev.disponibleHasta) {
      eventos.push({
        id: `entrega-${ev.id}`,
        fecha: claveFecha(ev.disponibleHasta),
        tipo: "entrega",
        titulo: `${ev.asignaturaNombre}: ${ev.titulo}`,
        subtitulo: "Cierra",
        href: `/portal/evaluaciones/${ev.id}`,
      });
    }
  }

  for (const c of listaComunicados) {
    eventos.push({
      id: `comunicado-${c.id}`,
      fecha: claveFecha(c.createdAt),
      tipo: "academico",
      titulo: c.titulo,
      subtitulo: c.alcance === "academia" ? "Toda la academia" : "Tu grupo",
      href: "/portal/comunicados",
    });
  }

  for (const e of listaEventos) {
    eventos.push({
      id: `evento-${e.id}`,
      fecha: e.fecha,
      tipo: e.tipo as EventoCalendario["tipo"],
      titulo: e.titulo,
      subtitulo: e.descripcion ?? undefined,
    });
  }

  return <CalendarioCliente eventos={eventos} hoy={claveFecha(new Date())} />;
}
