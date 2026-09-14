CREATE TABLE "alternativas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pregunta_id" uuid NOT NULL,
	"texto" text NOT NULL,
	"es_correcta" boolean DEFAULT false NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asignaturas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "asignaturas_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "asistencias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"curso_id" uuid NOT NULL,
	"estudiante_id" uuid NOT NULL,
	"fecha" date NOT NULL,
	"modalidad" text NOT NULL,
	"estado" text NOT NULL,
	"registrado_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "asistencias_curso_estudiante_fecha" UNIQUE("curso_id","estudiante_id","fecha"),
	CONSTRAINT "asistencias_modalidad_check" CHECK ("asistencias"."modalidad" in ('presencial','virtual')),
	CONSTRAINT "asistencias_estado_check" CHECK ("asistencias"."estado" in ('presente','tardanza','falta','justificado'))
);
--> statement-breakpoint
CREATE TABLE "comunicados" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titulo" text NOT NULL,
	"mensaje" text NOT NULL,
	"alcance" text NOT NULL,
	"grupo_id" uuid,
	"publicado_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comunicados_alcance_check" CHECK ("comunicados"."alcance" in ('academia','grupo'))
);
--> statement-breakpoint
CREATE TABLE "cursos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grupo_id" uuid NOT NULL,
	"asignatura_id" uuid NOT NULL,
	"docente_id" uuid NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cursos_grupo_asignatura" UNIQUE("grupo_id","asignatura_id")
);
--> statement-breakpoint
CREATE TABLE "estudiantes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dni" text NOT NULL,
	"nombres" text NOT NULL,
	"apellidos" text NOT NULL,
	"foto_url" text,
	"telefono" text,
	"email" text,
	"apoderado_nombre" text,
	"apoderado_telefono" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "estudiantes_dni_unique" UNIQUE("dni")
);
--> statement-breakpoint
CREATE TABLE "evaluaciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"curso_id" uuid NOT NULL,
	"titulo" text NOT NULL,
	"descripcion" text,
	"disponible_desde" timestamp with time zone,
	"disponible_hasta" timestamp with time zone,
	"creado_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grupos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"sede_id" uuid NOT NULL,
	"modalidad" text NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grupos_nombre_sede_modalidad" UNIQUE("nombre","sede_id","modalidad"),
	CONSTRAINT "grupos_modalidad_check" CHECK ("grupos"."modalidad" in ('presencial','virtual'))
);
--> statement-breakpoint
CREATE TABLE "intentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evaluacion_id" uuid NOT NULL,
	"estudiante_id" uuid NOT NULL,
	"iniciado_at" timestamp with time zone DEFAULT now() NOT NULL,
	"entregado_at" timestamp with time zone,
	"puntaje_obtenido" numeric,
	CONSTRAINT "intentos_evaluacion_estudiante" UNIQUE("evaluacion_id","estudiante_id")
);
--> statement-breakpoint
CREATE TABLE "matriculas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estudiante_id" uuid NOT NULL,
	"grupo_id" uuid NOT NULL,
	"fecha_ingreso" date NOT NULL,
	"fecha_fin" date NOT NULL,
	"retirada" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preguntas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evaluacion_id" uuid NOT NULL,
	"enunciado" text NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"puntaje" numeric DEFAULT '1' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recursos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"curso_id" uuid NOT NULL,
	"titulo" text NOT NULL,
	"descripcion" text,
	"archivo_path" text,
	"tipo_archivo" text,
	"tamano_bytes" integer,
	"enlace_url" text,
	"subido_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "respuestas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intento_id" uuid NOT NULL,
	"pregunta_id" uuid NOT NULL,
	"alternativa_id" uuid NOT NULL,
	CONSTRAINT "respuestas_intento_pregunta" UNIQUE("intento_id","pregunta_id")
);
--> statement-breakpoint
CREATE TABLE "sedes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sedes_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "sesiones" (
	"id" text PRIMARY KEY NOT NULL,
	"usuario_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"nombre_completo" text NOT NULL,
	"rol" text NOT NULL,
	"estudiante_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuarios_email_unique" UNIQUE("email"),
	CONSTRAINT "usuarios_rol_check" CHECK ("usuarios"."rol" in ('admin','docente','estudiante'))
);
--> statement-breakpoint
ALTER TABLE "alternativas" ADD CONSTRAINT "alternativas_pregunta_id_preguntas_id_fk" FOREIGN KEY ("pregunta_id") REFERENCES "public"."preguntas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_curso_id_cursos_id_fk" FOREIGN KEY ("curso_id") REFERENCES "public"."cursos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_estudiante_id_estudiantes_id_fk" FOREIGN KEY ("estudiante_id") REFERENCES "public"."estudiantes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asistencias" ADD CONSTRAINT "asistencias_registrado_por_usuarios_id_fk" FOREIGN KEY ("registrado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_grupo_id_grupos_id_fk" FOREIGN KEY ("grupo_id") REFERENCES "public"."grupos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_publicado_por_usuarios_id_fk" FOREIGN KEY ("publicado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_grupo_id_grupos_id_fk" FOREIGN KEY ("grupo_id") REFERENCES "public"."grupos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_asignatura_id_asignaturas_id_fk" FOREIGN KEY ("asignatura_id") REFERENCES "public"."asignaturas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_docente_id_usuarios_id_fk" FOREIGN KEY ("docente_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluaciones" ADD CONSTRAINT "evaluaciones_curso_id_cursos_id_fk" FOREIGN KEY ("curso_id") REFERENCES "public"."cursos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluaciones" ADD CONSTRAINT "evaluaciones_creado_por_usuarios_id_fk" FOREIGN KEY ("creado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grupos" ADD CONSTRAINT "grupos_sede_id_sedes_id_fk" FOREIGN KEY ("sede_id") REFERENCES "public"."sedes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intentos" ADD CONSTRAINT "intentos_evaluacion_id_evaluaciones_id_fk" FOREIGN KEY ("evaluacion_id") REFERENCES "public"."evaluaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "intentos" ADD CONSTRAINT "intentos_estudiante_id_estudiantes_id_fk" FOREIGN KEY ("estudiante_id") REFERENCES "public"."estudiantes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_estudiante_id_estudiantes_id_fk" FOREIGN KEY ("estudiante_id") REFERENCES "public"."estudiantes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_grupo_id_grupos_id_fk" FOREIGN KEY ("grupo_id") REFERENCES "public"."grupos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preguntas" ADD CONSTRAINT "preguntas_evaluacion_id_evaluaciones_id_fk" FOREIGN KEY ("evaluacion_id") REFERENCES "public"."evaluaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recursos" ADD CONSTRAINT "recursos_curso_id_cursos_id_fk" FOREIGN KEY ("curso_id") REFERENCES "public"."cursos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recursos" ADD CONSTRAINT "recursos_subido_por_usuarios_id_fk" FOREIGN KEY ("subido_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respuestas" ADD CONSTRAINT "respuestas_intento_id_intentos_id_fk" FOREIGN KEY ("intento_id") REFERENCES "public"."intentos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respuestas" ADD CONSTRAINT "respuestas_pregunta_id_preguntas_id_fk" FOREIGN KEY ("pregunta_id") REFERENCES "public"."preguntas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respuestas" ADD CONSTRAINT "respuestas_alternativa_id_alternativas_id_fk" FOREIGN KEY ("alternativa_id") REFERENCES "public"."alternativas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_estudiante_id_estudiantes_id_fk" FOREIGN KEY ("estudiante_id") REFERENCES "public"."estudiantes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "usuarios_estudiante_unico" ON "usuarios" USING btree ("estudiante_id") WHERE "usuarios"."estudiante_id" is not null;