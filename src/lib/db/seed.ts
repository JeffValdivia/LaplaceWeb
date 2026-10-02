// Crea el primer usuario administrador. Se corre una sola vez.
// Uso: ADMIN_DNI=... ADMIN_PASSWORD=... ADMIN_NOMBRE="..." npm run db:seed
import { db } from "./index";
import { usuarios } from "./schema";
import { hashPassword } from "../auth/password";
import { eq } from "drizzle-orm";

async function main() {
  const dni = process.env.ADMIN_DNI ?? "00000000";
  const password = process.env.ADMIN_PASSWORD ?? "admin123456";
  const nombreCompleto = process.env.ADMIN_NOMBRE ?? "Administrador";

  const existente = await db.query.usuarios.findFirst({
    where: eq(usuarios.dni, dni),
  });

  if (existente) {
    console.log(`Ya existe un usuario con DNI ${dni}, no se creó nada.`);
    process.exit(0);
  }

  const passwordHash = await hashPassword(password);
  await db.insert(usuarios).values({
    dni,
    passwordHash,
    nombreCompleto,
    rol: "admin",
  });

  console.log(`Admin creado: DNI ${dni} / ${password}`);
  console.log("Cambia la contraseña luego de tu primer login.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
