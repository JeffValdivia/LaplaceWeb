import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Desarrollo local: el navegador a veces no resuelve "localhost" y hay que
  // entrar por 127.0.0.1. Sin esto, Next.js bloquea el WebSocket de HMR por
  // origen no permitido y el cliente nunca termina de arrancar — la página
  // se ve bien (vino del servidor) pero ningún botón ni select responde.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
