import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  subject: z.string().min(3).max(120),
  message: z.string().min(10).max(4000),
});

const hits = new Map<string, number[]>();
const RATE_LIMIT = 3;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= RATE_LIMIT) {
    return NextResponse.json({ error: "Muitas mensagens enviadas. Tente novamente mais tarde." }, { status: 429 });
  }
  list.push(now);
  hits.set(ip, list);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Preencha todos os campos corretamente." }, { status: 400 });
  }

  // Em produção: enviar para e-mail/SMTP/CRM. Aqui registramos em log.
  console.log("[contato]", JSON.stringify(parsed.data));

  return NextResponse.json({ ok: true, message: "Mensagem recebida. Obrigado!" });
}
