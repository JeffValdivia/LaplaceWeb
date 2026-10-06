CREATE TABLE "alternativas_eval_docente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pregunta_id" uuid NOT NULL,
	"texto" text NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluaciones_docente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"curso_id" uuid NOT NULL,
	"estudiante_id" uuid NOT NULL,
	"comentario" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "evaluaciones_docente_curso_estudiante" UNIQUE("curso_id","estudiante_id")
);
--> statement-breakpoint
CREATE TABLE "horarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grupo_id" uuid NOT NULL,
	"curso_id" uuid,
	"dia_semana" integer NOT NULL,
	"hora_inicio" time NOT NULL,
	"hora_fin" time NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "horarios_dia_semana_check" CHECK ("horarios"."dia_semana" between 1 and 7)
);
--> statement-breakpoint
CREATE TABLE "preguntas_eval_docente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enunciado" text NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "respuestas_eval_docente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evaluacion_docente_id" uuid NOT NULL,
	"pregunta_id" uuid NOT NULL,
	"alternativa_id" uuid NOT NULL,
	CONSTRAINT "respuestas_eval_docente_unica" UNIQUE("evaluacion_docente_id","pregunta_id")
);
--> statement-breakpoint
ALTER TABLE "alternativas_eval_docente" ADD CONSTRAINT "alternativas_eval_docente_pregunta_id_preguntas_eval_docente_id_fk" FOREIGN KEY ("pregunta_id") REFERENCES "public"."preguntas_eval_docente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluaciones_docente" ADD CONSTRAINT "evaluaciones_docente_curso_id_cursos_id_fk" FOREIGN KEY ("curso_id") REFERENCES "public"."cursos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluaciones_docente" ADD CONSTRAINT "evaluaciones_docente_estudiante_id_estudiantes_id_fk" FOREIGN KEY ("estudiante_id") REFERENCES "public"."estudiantes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "horarios" ADD CONSTRAINT "horarios_grupo_id_grupos_id_fk" FOREIGN KEY ("grupo_id") REFERENCES "public"."grupos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "horarios" ADD CONSTRAINT "horarios_curso_id_cursos_id_fk" FOREIGN KEY ("curso_id") REFERENCES "public"."cursos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respuestas_eval_docente" ADD CONSTRAINT "respuestas_eval_docente_evaluacion_docente_id_evaluaciones_docente_id_fk" FOREIGN KEY ("evaluacion_docente_id") REFERENCES "public"."evaluaciones_docente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respuestas_eval_docente" ADD CONSTRAINT "respuestas_eval_docente_pregunta_id_preguntas_eval_docente_id_fk" FOREIGN KEY ("pregunta_id") REFERENCES "public"."preguntas_eval_docente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "respuestas_eval_docente" ADD CONSTRAINT "respuestas_eval_docente_alternativa_id_alternativas_eval_docente_id_fk" FOREIGN KEY ("alternativa_id") REFERENCES "public"."alternativas_eval_docente"("id") ON DELETE no action ON UPDATE no action;