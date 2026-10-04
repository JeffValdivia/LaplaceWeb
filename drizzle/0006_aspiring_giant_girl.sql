CREATE TABLE "eventos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titulo" text NOT NULL,
	"descripcion" text,
	"fecha" date NOT NULL,
	"tipo" text NOT NULL,
	"alcance" text NOT NULL,
	"sede_id" uuid,
	"grupo_id" uuid,
	"creado_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "eventos_tipo_check" CHECK ("eventos"."tipo" in ('academico','examen','entrega')),
	CONSTRAINT "eventos_alcance_check" CHECK ("eventos"."alcance" in ('academia','sede','grupo'))
);
--> statement-breakpoint
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_sede_id_sedes_id_fk" FOREIGN KEY ("sede_id") REFERENCES "public"."sedes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_grupo_id_grupos_id_fk" FOREIGN KEY ("grupo_id") REFERENCES "public"."grupos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_creado_por_usuarios_id_fk" FOREIGN KEY ("creado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;