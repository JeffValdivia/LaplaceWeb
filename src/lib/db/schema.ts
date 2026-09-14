import {
  pgTable,
  uuid,
  text,
  boolean,
  date,
  timestamp,
  numeric,
  integer,
  unique,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ── Cuentas y sesiones (módulo 12: seguridad y roles) ───────────────────
export const usuarios = pgTable(
  "usuarios",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    nombreCompleto: text("nombre_completo").notNull(),
    rol: text("rol").notNull(),
    // Solo se llena cuando rol = 'estudiante'; vincula la cuenta con el
    // registro de matrícula que ya existía antes de que el alumno se
    // autoregistrara. Sin onDelete: no existe (todavía) una acción de
    // "eliminar estudiante", así que por seguridad Postgres debe impedir
    // borrar un estudiante mientras tenga una cuenta de acceso vinculada,
    // en vez de dejarla huérfana silenciosamente.
    estudianteId: uuid("estudiante_id").references(() => estudiantes.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("usuarios_rol_check", sql`${t.rol} in ('admin','docente','estudiante')`),
    uniqueIndex("usuarios_estudiante_unico")
      .on(t.estudianteId)
      .where(sql`${t.estudianteId} is not null`),
  ]
);

export const sesiones = pgTable("sesiones", {
  // Token de sesión aleatorio (no correlativo) — es la propia cookie.
  id: text("id").primaryKey(),
  usuarioId: uuid("usuario_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Sedes (módulo 04): local/campus de la academia ──────────────────────
export const sedes = pgTable("sedes", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull().unique(),
  descripcion: text("descripcion"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Grupos académicos (módulo 03) ───────────────────────────────────────
// Un grupo es la cohorte que paga/se matricula: sede + modalidad fija.
// Qué materias se dictan dentro de él, y quién las dicta, vive en `cursos`.
export const grupos = pgTable(
  "grupos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nombre: text("nombre").notNull(),
    sedeId: uuid("sede_id")
      .notNull()
      .references(() => sedes.id),
    modalidad: text("modalidad").notNull(),
    activo: boolean("activo").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("grupos_nombre_sede_modalidad").on(t.nombre, t.sedeId, t.modalidad),
    check("grupos_modalidad_check", sql`${t.modalidad} in ('presencial','virtual')`),
  ]
);

// ── Asignaturas (catálogo de materias) ───────────────────────────────────
export const asignaturas = pgTable("asignaturas", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull().unique(),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Cursos: la materia que un docente dicta dentro de un grupo ──────────
// Un grupo puede tener varios cursos (una fila por materia); un docente
// puede aparecer en varios cursos, incluso de distintos grupos.
export const cursos = pgTable(
  "cursos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    grupoId: uuid("grupo_id")
      .notNull()
      .references(() => grupos.id, { onDelete: "cascade" }),
    asignaturaId: uuid("asignatura_id")
      .notNull()
      .references(() => asignaturas.id),
    docenteId: uuid("docente_id")
      .notNull()
      .references(() => usuarios.id),
    activo: boolean("activo").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("cursos_grupo_asignatura").on(t.grupoId, t.asignaturaId)]
);

// ── Estudiantes (módulo 02) ──────────────────────────────────────────────
export const estudiantes = pgTable("estudiantes", {
  id: uuid("id").primaryKey().defaultRandom(),
  dni: text("dni").notNull().unique(),
  nombres: text("nombres").notNull(),
  apellidos: text("apellidos").notNull(),
  fotoUrl: text("foto_url"),
  telefono: text("telefono"),
  email: text("email"),
  apoderadoNombre: text("apoderado_nombre"),
  apoderadoTelefono: text("apoderado_telefono"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Matrículas (módulos 02 y 05) ─────────────────────────────────────────
// fecha_fin se calcula en el servidor al matricular (fecha_ingreso + 1 mes),
// no como columna generada en la base — así queda igual de simple sin
// depender de sintaxis específica de Postgres para columnas calculadas.
export const matriculas = pgTable("matriculas", {
  id: uuid("id").primaryKey().defaultRandom(),
  estudianteId: uuid("estudiante_id")
    .notNull()
    .references(() => estudiantes.id, { onDelete: "cascade" }),
  grupoId: uuid("grupo_id")
    .notNull()
    .references(() => grupos.id),
  fechaIngreso: date("fecha_ingreso").notNull(),
  fechaFin: date("fecha_fin").notNull(),
  retirada: boolean("retirada").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Campus virtual (módulo 06) ───────────────────────────────────────────
export const recursos = pgTable("recursos", {
  id: uuid("id").primaryKey().defaultRandom(),
  cursoId: uuid("curso_id")
    .notNull()
    .references(() => cursos.id, { onDelete: "cascade" }),
  titulo: text("titulo").notNull(),
  descripcion: text("descripcion"),
  archivoPath: text("archivo_path"), // ruta en disco, si es un archivo subido
  tipoArchivo: text("tipo_archivo"),
  tamanoBytes: integer("tamano_bytes"),
  enlaceUrl: text("enlace_url"), // si es un video/enlace externo
  subidoPor: uuid("subido_por").references(() => usuarios.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Evaluaciones (módulo 07) ─────────────────────────────────────────────
export const evaluaciones = pgTable("evaluaciones", {
  id: uuid("id").primaryKey().defaultRandom(),
  cursoId: uuid("curso_id")
    .notNull()
    .references(() => cursos.id, { onDelete: "cascade" }),
  titulo: text("titulo").notNull(),
  descripcion: text("descripcion"),
  disponibleDesde: timestamp("disponible_desde", { withTimezone: true }),
  disponibleHasta: timestamp("disponible_hasta", { withTimezone: true }),
  creadoPor: uuid("creado_por").references(() => usuarios.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const preguntas = pgTable("preguntas", {
  id: uuid("id").primaryKey().defaultRandom(),
  evaluacionId: uuid("evaluacion_id")
    .notNull()
    .references(() => evaluaciones.id, { onDelete: "cascade" }),
  enunciado: text("enunciado").notNull(),
  orden: integer("orden").notNull().default(0),
  puntaje: numeric("puntaje").notNull().default("1"),
});

export const alternativas = pgTable("alternativas", {
  id: uuid("id").primaryKey().defaultRandom(),
  preguntaId: uuid("pregunta_id")
    .notNull()
    .references(() => preguntas.id, { onDelete: "cascade" }),
  texto: text("texto").notNull(),
  esCorrecta: boolean("es_correcta").notNull().default(false),
  orden: integer("orden").notNull().default(0),
});

export const intentos = pgTable(
  "intentos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    evaluacionId: uuid("evaluacion_id")
      .notNull()
      .references(() => evaluaciones.id, { onDelete: "cascade" }),
    estudianteId: uuid("estudiante_id")
      .notNull()
      .references(() => estudiantes.id, { onDelete: "cascade" }),
    iniciadoAt: timestamp("iniciado_at", { withTimezone: true }).notNull().defaultNow(),
    entregadoAt: timestamp("entregado_at", { withTimezone: true }),
    puntajeObtenido: numeric("puntaje_obtenido"),
  },
  (t) => [unique("intentos_evaluacion_estudiante").on(t.evaluacionId, t.estudianteId)]
);

export const respuestas = pgTable(
  "respuestas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    intentoId: uuid("intento_id")
      .notNull()
      .references(() => intentos.id, { onDelete: "cascade" }),
    preguntaId: uuid("pregunta_id")
      .notNull()
      .references(() => preguntas.id),
    alternativaId: uuid("alternativa_id")
      .notNull()
      .references(() => alternativas.id),
  },
  (t) => [unique("respuestas_intento_pregunta").on(t.intentoId, t.preguntaId)]
);

// ── Asistencia (módulo 08) ───────────────────────────────────────────────
export const asistencias = pgTable(
  "asistencias",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cursoId: uuid("curso_id")
      .notNull()
      .references(() => cursos.id, { onDelete: "cascade" }),
    estudianteId: uuid("estudiante_id")
      .notNull()
      .references(() => estudiantes.id, { onDelete: "cascade" }),
    fecha: date("fecha").notNull(),
    modalidad: text("modalidad").notNull(),
    estado: text("estado").notNull(),
    registradoPor: uuid("registrado_por").references(() => usuarios.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("asistencias_curso_estudiante_fecha").on(t.cursoId, t.estudianteId, t.fecha),
    check("asistencias_modalidad_check", sql`${t.modalidad} in ('presencial','virtual')`),
    check(
      "asistencias_estado_check",
      sql`${t.estado} in ('presente','tardanza','falta','justificado')`
    ),
  ]
);

// ── Comunicados (módulo 09) ──────────────────────────────────────────────
export const comunicados = pgTable(
  "comunicados",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    titulo: text("titulo").notNull(),
    mensaje: text("mensaje").notNull(),
    alcance: text("alcance").notNull(),
    grupoId: uuid("grupo_id").references(() => grupos.id, { onDelete: "cascade" }),
    publicadoPor: uuid("publicado_por").references(() => usuarios.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("comunicados_alcance_check", sql`${t.alcance} in ('academia','grupo')`)]
);
