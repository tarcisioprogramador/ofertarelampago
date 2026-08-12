import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  // Headers de segurança
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

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
