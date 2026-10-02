// Carga los catálogos fijos de la postulación: sedes + sus grupos, y
// carreras. Seguro de repetir (usa onConflictDoNothing en cada nombre
// único). Uso: npm run db:seed-postulacion
import { db } from "./index";
import { sedes, grupos, carreras } from "./schema";
import { eq } from "drizzle-orm";

const GRUPOS_POR_SEDE: Record<string, { nombre: string; modalidad: "presencial" | "virtual" }[]> = {
  UCSM: [
    { nombre: "CATOLICA MAÑANA 1", modalidad: "presencial" },
    { nombre: "CATOLICA MAÑANA 2", modalidad: "presencial" },
    { nombre: "CATOLICA TARDE", modalidad: "presencial" },
    { nombre: "CATOLICA SABADOS", modalidad: "presencial" },
    { nombre: "CATOLICA VIRTUAL", modalidad: "virtual" },
    { nombre: "CATOLICA EXTRAORDINARIO", modalidad: "presencial" },
    { nombre: "CICLO BASE", modalidad: "presencial" },
  ],
  UNSA: [
    { nombre: "CICLO ORDINARIO MAN", modalidad: "presencial" },
    { nombre: "CICLO ORDINARIO TAR", modalidad: "presencial" },
    { nombre: "CICLO ORDINARIO NOC", modalidad: "presencial" },
    { nombre: "CICLO CEPRUNSA MAN", modalidad: "presencial" },
    { nombre: "CICLO CEPRUNSA TAR", modalidad: "presencial" },
    { nombre: "CICLO CEPRUNSA NOC", modalidad: "presencial" },
    { nombre: "CICLO CEPREQUINTOS MAN", modalidad: "presencial" },
    { nombre: "CICLO CEPREQUINTOS NOC", modalidad: "presencial" },
    { nombre: "CICLO BASE MAN", modalidad: "presencial" },
    { nombre: "CICLO BASE NOC", modalidad: "presencial" },
    { nombre: "CICLO VIRTUAL UNSA", modalidad: "virtual" },
  ],
};

const CARRERAS = ["Medicina", "Ing. Sistemas", "Ing. Civil", "Ing. de Minas", "Arquitectura"];

async function main() {
  for (const nombre of Object.keys(GRUPOS_POR_SEDE)) {
    await db.insert(sedes).values({ nombre }).onConflictDoNothing({ target: sedes.nombre });
    const [sede] = await db.select({ id: sedes.id }).from(sedes).where(eq(sedes.nombre, nombre)).limit(1);

    for (const grupo of GRUPOS_POR_SEDE[nombre]) {
      await db
        .insert(grupos)
        .values({ nombre: grupo.nombre, sedeId: sede.id, modalidad: grupo.modalidad })
        .onConflictDoNothing({ target: [grupos.nombre, grupos.sedeId, grupos.modalidad] });
    }
    console.log(`Sede ${nombre}: ${GRUPOS_POR_SEDE[nombre].length} grupos listos.`);
  }

  for (const nombre of CARRERAS) {
    await db.insert(carreras).values({ nombre }).onConflictDoNothing({ target: carreras.nombre });
  }
  console.log(`Carreras: ${CARRERAS.length} listas.`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
