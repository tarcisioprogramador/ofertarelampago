import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "or_admin";
const secret = () => process.env.SESSION_SECRET ?? "dev-secret";

export function signToken(payload: string): string {
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyToken(token: string): boolean {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = createHmac("sha256", secret()).update(payload).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b) && JSON.parse(Buffer.from(payload, "base64url").toString()).exp > Date.now();
}

function makePayload(): string {
  const body = JSON.stringify({ role: "ADMIN", exp: Date.now() + 8 * 3600000 });
  return Buffer.from(body).toString("base64url");
}

/** Marca o cookie de sessão (chamado pelo endpoint de login) */
export async function setAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, signToken(makePayload()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 8 * 3600,
  });
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return false;
  return verifyToken(token);
}

/** Usar em layouts do admin: redireciona para login se não autenticado */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}
