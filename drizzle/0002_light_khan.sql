CREATE TABLE "carreras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "carreras_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
ALTER TABLE "estudiantes" ADD COLUMN "fecha_nacimiento" date;--> statement-breakpoint
ALTER TABLE "matriculas" ADD COLUMN "carrera_id" uuid;--> statement-breakpoint
ALTER TABLE "matriculas" ADD COLUMN "proceso" text;--> statement-breakpoint
ALTER TABLE "matriculas" ADD COLUMN "tipo_postulacion" text;--> statement-breakpoint
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_carrera_id_carreras_id_fk" FOREIGN KEY ("carrera_id") REFERENCES "public"."carreras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_proceso_check" CHECK ("matriculas"."proceso" in ('ordinario','extraordinario','preca','ceprequintos'));--> statement-breakpoint
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_tipo_postulacion_check" CHECK ("matriculas"."tipo_postulacion" in ('egresado','estudiante'));