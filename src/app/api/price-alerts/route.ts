import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z
  .object({
    productId: z.string().min(1),
    desiredPrice: z.number().positive().max(1_000_000),
    email: z.string().email().optional(),
    whatsapp: z
      .string()
      .regex(/^[0-9()+-\s]{8,20}$/)
      .optional(),
  })
  .refine((d) => d.email || d.whatsapp, { message: "Informe e-mail ou WhatsApp" });

// Rate limit simples em memória (por IP)
const hits = new Map<string, number[]>();
const RATE_LIMIT = 5; // 5 alertas
const WINDOW_MS = 10 * 60 * 1000;

function allow(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= RATE_LIMIT) return false;
  list.push(now);
  hits.set(ip, list);
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allow(ip)) {
    return NextResponse.json({ error: "Muitos alertas criados em pouco tempo. Tente novamente em alguns minutos." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  const { productId, desiredPrice, email, whatsapp } = parsed.data;
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }

  await prisma.priceAlert.create({
    data: { productId, desiredPrice, email: email ?? null, whatsapp: whatsapp ?? null },
  });

  return NextResponse.json({ ok: true, message: "Alerta criado. Vamos avisar você quando o preço cair!" });
}
