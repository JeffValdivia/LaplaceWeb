ALTER TABLE "cursos" DROP CONSTRAINT "cursos_grupo_id_grupos_id_fk";
--> statement-breakpoint
ALTER TABLE "matriculas" DROP CONSTRAINT "matriculas_grupo_id_grupos_id_fk";
--> statement-breakpoint
ALTER TABLE "cursos" ALTER COLUMN "grupo_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "matriculas" ALTER COLUMN "grupo_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_grupo_id_grupos_id_fk" FOREIGN KEY ("grupo_id") REFERENCES "public"."grupos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_grupo_id_grupos_id_fk" FOREIGN KEY ("grupo_id") REFERENCES "public"."grupos"("id") ON DELETE set null ON UPDATE no action;