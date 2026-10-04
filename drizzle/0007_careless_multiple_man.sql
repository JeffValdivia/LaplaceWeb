ALTER TABLE "asignaturas" ADD COLUMN "docente_id" uuid;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "sede_id" uuid;--> statement-breakpoint
ALTER TABLE "asignaturas" ADD CONSTRAINT "asignaturas_docente_id_usuarios_id_fk" FOREIGN KEY ("docente_id") REFERENCES "public"."usuarios"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_sede_id_sedes_id_fk" FOREIGN KEY ("sede_id") REFERENCES "public"."sedes"("id") ON DELETE no action ON UPDATE no action;