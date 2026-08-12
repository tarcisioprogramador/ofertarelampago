import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  // Headers de segurança
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://http2.mlstatic.com https://images.tcdn.com.br https://a-static.mlcdn.com.br",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; ")
  );

  // Rotas de API respondem 401 por conta própria — nunca redirecionar
  if (pathname.startsWith("/api/")) return res;

  // Proteção do painel admin (exceto a página de login — tolerando a barra final)
  const normalized = pathname.replace(/\/+$/, "");
  if ((normalized === "/admin" || normalized.startsWith("/admin/")) && normalized !== "/admin/login") {
    const token = req.cookies.get("or_admin")?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login/";
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|images/|favicon.ico).*)"],
};
