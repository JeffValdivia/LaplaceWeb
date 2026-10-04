ALTER TABLE "asignaturas" DROP CONSTRAINT "asignaturas_nombre_unique";--> statement-breakpoint
ALTER TABLE "asignaturas" ADD COLUMN "sede_id" uuid;--> statement-breakpoint
-- Asignaturas creadas antes de este cambio no tenían sede propia. Sus cursos
-- quedaron sin grupo (huérfanos) en una limpieza anterior, así que no hay
-- forma de inferir la sede real desde los datos — se les asigna UCSM por
-- defecto; el admin puede recrearlas para UNSA si corresponde.
UPDATE "asignaturas" SET "sede_id" = (SELECT "id" FROM "sedes" WHERE "nombre" = 'UCSM' LIMIT 1)
  WHERE "sede_id" IS NULL;--> statement-breakpoint
ALTER TABLE "asignaturas" ALTER COLUMN "sede_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "asignaturas" ADD CONSTRAINT "asignaturas_sede_id_sedes_id_fk" FOREIGN KEY ("sede_id") REFERENCES "public"."sedes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asignaturas" ADD CONSTRAINT "asignaturas_nombre_sede" UNIQUE("nombre","sede_id");