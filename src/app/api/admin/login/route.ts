import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setAdminSession } from "@/lib/admin";

const schema = z.object({ password: z.string().min(1) });

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Senha inválida." }, { status: 400 });
  }

  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (parsed.data.password !== expected || !expected) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  await setAdminSession();
  return NextResponse.json({ ok: true });
}
