// Crea el primer usuario administrador. Se corre una sola vez.
// Uso: ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NOMBRE="..." npm run db:seed
import { db } from "./index";
import { usuarios } from "./schema";
import { hashPassword } from "../auth/password";
import { eq } from "drizzle-orm";

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@laplace.test";
  const password = process.env.ADMIN_PASSWORD ?? "admin123456";
  const nombreCompleto = process.env.ADMIN_NOMBRE ?? "Administrador";

  const existente = await db.query.usuarios.findFirst({
    where: eq(usuarios.email, email),
  });

  if (existente) {
    console.log(`Ya existe un usuario con ${email}, no se creó nada.`);
    process.exit(0);
  }

  const passwordHash = await hashPassword(password);
  await db.insert(usuarios).values({
    email,
    passwordHash,
    nombreCompleto,
    rol: "admin",
  });

  console.log(`Admin creado: ${email} / ${password}`);
  console.log("Cambia la contraseña luego de tu primer login.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
