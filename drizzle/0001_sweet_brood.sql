ALTER TABLE "usuarios" DROP CONSTRAINT "usuarios_email_unique";--> statement-breakpoint
ALTER TABLE "usuarios" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "dni" text;--> statement-breakpoint
-- Cuentas de estudiante: toman el DNI de su registro de matrícula.
UPDATE "usuarios" u SET "dni" = e."dni"
  FROM "estudiantes" e
  WHERE e."id" = u."estudiante_id" AND u."dni" IS NULL;--> statement-breakpoint
-- Cuentas admin/docente (sin estudiante vinculado): no tenían DNI capturado
-- antes de este cambio. Se les asigna un valor temporal correlativo; hay que
-- actualizarlo a su DNI real desde Seguridad y roles.
WITH faltantes AS (
  SELECT "id", row_number() OVER (ORDER BY "created_at") AS rn
  FROM "usuarios"
  WHERE "dni" IS NULL
)
UPDATE "usuarios" SET "dni" = lpad(faltantes.rn::text, 8, '0')
  FROM faltantes
  WHERE "usuarios"."id" = faltantes."id";--> statement-breakpoint
ALTER TABLE "usuarios" ALTER COLUMN "dni" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_dni_unique" UNIQUE("dni");
