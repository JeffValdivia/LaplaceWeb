import { NextResponse, type NextRequest } from "next/server";

// No podemos leer la sesión (tabla en Postgres) desde el runtime edge del
// proxy sin un round-trip a la base — así que aquí solo se revisa que
// exista la cookie. La validación real (¿existe la sesión? ¿no expiró?
// ¿qué rol tiene?) ocurre en cada layout con acceso a la base de datos.
//
// Importante: de /login y /registro NO se rebota aquí solo por tener la
// cookie — una cookie puede estar presente pero ya no ser válida (sesión
// borrada o expirada), y como esas páginas no son del todo públicas para
// el proxy, quedaría atrapado en un bucle infinito /login → / → /login.
// Esas dos páginas validan la sesión ellas mismas (con acceso a la BD) y
// redirigen a "/" si de verdad ya hay una sesión vigente.
const COOKIE = "sesion_id";

export function proxy(request: NextRequest) {
  const tieneCookie = request.cookies.has(COOKIE);
  const esPublica =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/registro");

  if (!tieneCookie && !esPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
