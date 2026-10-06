CREATE TABLE "evaluacion_docente_config" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"activo" boolean DEFAULT false NOT NULL,
	"actualizado_por" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "evaluacion_docente_config_singleton" CHECK ("evaluacion_docente_config"."id" = 1)
);
--> statement-breakpoint
ALTER TABLE "evaluacion_docente_config" ADD CONSTRAINT "evaluacion_docente_config_actualizado_por_usuarios_id_fk" FOREIGN KEY ("actualizado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;