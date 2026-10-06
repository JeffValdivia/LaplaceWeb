CREATE TABLE "avances_adjuntos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"avance_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"nombre" text NOT NULL,
	"archivo_path" text NOT NULL,
	"tipo_archivo" text,
	"tamano_bytes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "avances_adjuntos_tipo_check" CHECK ("avances_adjuntos"."tipo" in ('imagen','archivo'))
);
--> statement-breakpoint
ALTER TABLE "avances_adjuntos" ADD CONSTRAINT "avances_adjuntos_avance_id_avances_clase_id_fk" FOREIGN KEY ("avance_id") REFERENCES "public"."avances_clase"("id") ON DELETE cascade ON UPDATE no action;