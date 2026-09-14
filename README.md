# Academia Laplace — Sistema de Gestión Académica (self-hosted)

Desarrollo independiente del sistema para la Academia Laplace, con
infraestructura propia (Hetzner + Docker) en vez de un backend
gestionado. Next.js 16 (App Router) + PostgreSQL + Drizzle ORM.

## Estado del proyecto

**Infraestructura base: en construcción.**

| Pieza | Estado |
| --- | --- |
| Proyecto Next.js + TypeScript + Tailwind | ✅ listo |
| Esquema de base de datos (Drizzle) — los 12 módulos | ✅ listo |
| Autenticación y sesiones (propia, sin librería externa) | ✅ listo |
| Docker Compose (app + Postgres + Caddy) | ✅ listo |
| Migraciones aplicadas a una base real | ⏳ pendiente (falta Docker instalado) |
| Pantallas (login, dashboard, etc.) | ⏳ pendiente — arranca con Fase 1 |

## Por qué autenticación propia y no Auth.js

En la propuesta inicial mencioné Auth.js. Al construir esto decidí usar
sesiones propias (cookie firmada + tabla `sesiones` en Postgres) en vez
de la librería: mismo resultado (sesión revocable en base de datos, sin
depender de un proveedor externo), pero con menos piezas de las que
depender y sin los casos borde de Auth.js con el proveedor de
credenciales. Es la misma garantía de seguridad, solo que más simple de
mantener. Ver `src/lib/auth/`.

## Poner el proyecto a andar

### 1. Docker (vía Colima, no Docker Desktop)

Docker Desktop y Homebrew dejaron de soportar Mac Intel en macOS 13.
En su lugar quedaron instalados manualmente, sin sudo, en `~/bin`,
`~/.local/bin` y `~/.docker/cli-plugins`:

- **Colima** — motor de contenedores (reemplaza a Docker Desktop)
- **Docker CLI** — el comando `docker` de siempre
- **Docker Compose** — plugin `docker compose`
- **Lima** — la VM ligera de la que depende Colima

Ya quedó agregado `~/bin` y `~/.local/bin` al `PATH` en `~/.zshrc` —
abre una terminal nueva para que tome efecto, o corre
`source ~/.zshrc` en una que ya tengas abierta.

Cada vez que reinicies la Mac, hay que volver a levantar la VM:

```bash
colima start
```

(`colima status` para ver si ya está corriendo, `colima stop` para
apagarla y liberar RAM).

> Nota: Colima avisó que en Intel con macOS anterior a 15.5 podría
> necesitar el modo `qemu` en vez de `vz` si algún contenedor no
> arranca bien. Por ahora arrancó sin problema; si más adelante ves
> contenedores que no levantan, lo cambiamos con
> `colima start --vm-type qemu`.

### 2. Variables de entorno

```bash
cp .env.local.example .env.local
```

Completa `DB_PASSWORD` con cualquier contraseña (solo se usa en tu
máquina) y ajusta `DATABASE_URL` si cambiaste la contraseña.

### 3. Levantar Postgres en local

```bash
docker compose up db -d
```

### 4. Generar y aplicar el esquema

```bash
npx drizzle-kit push
```

### 5. Correr la app

```bash
npm install
npm run dev
```

## Desplegar en producción (cuando el VPS esté listo)

1. Crear cuenta y VPS en Hetzner (guía pendiente — se agrega cuando se
   cree la cuenta).
2. Copiar el proyecto al VPS, crear `.env` con `DB_PASSWORD` y
   `DOMINIO` (el dominio real).
3. `docker compose up -d --build` (en el VPS, `docker-compose.override.yml`
   no se usa — Postgres queda cerrado, sin exponerse a internet).
4. Caddy pide el certificado HTTPS solo, apuntando el DNS del dominio
   al VPS.

## Estructura

```
src/
  app/                       Páginas y rutas
  lib/
    db/
      schema.ts               Esquema completo (los 12 módulos)
      index.ts                Cliente de Drizzle
    auth/
      session.ts               Sesiones propias (cookie + tabla)
      password.ts               Hash de contraseñas (bcrypt)
drizzle.config.ts             Configuración de migraciones
docker-compose.yml            app + db + caddy (producción)
docker-compose.override.yml   Expone Postgres solo en desarrollo local
Dockerfile                    Build multi-stage de la app
Caddyfile                     Proxy con HTTPS automático
```
