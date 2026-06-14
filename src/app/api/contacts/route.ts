import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contacts, rateLimits } from "@/db/schema";
import { Resend } from "resend";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";

const resend = new Resend(process.env.RESEND_API_KEY);

const RATE_LIMIT_MAX    = 5;
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutos em ms
const EMAIL_COOLDOWN    = 60 * 60 * 1000; // 1 hora em ms

const schema = z.object({
  name:  z.string().min(2).max(50),
  email: z.string().email(),
});

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}

async function checkIpRateLimit(ip: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW);

  const [row] = await db
    .insert(rateLimits)
    .values({ ip, count: 1, windowStart: new Date() })
    .onConflictDoUpdate({
      target: rateLimits.ip,
      set: {
        count: sql`CASE
          WHEN rate_limits.window_start > ${windowStart.toISOString()}
          THEN rate_limits.count + 1
          ELSE 1
        END`,
        windowStart: sql`CASE
          WHEN rate_limits.window_start > ${windowStart.toISOString()}
          THEN rate_limits.window_start
          ELSE now()
        END`,
      },
    })
    .returning();

  return (row?.count ?? 0) > RATE_LIMIT_MAX;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  const limited = await checkIpRateLimit(ip);
  if (limited) {
    return NextResponse.json(
      { error: "Demasiadas tentativas. Aguarda alguns minutos e tenta novamente." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { name, email } = parsed.data;

  const existing = await db.query.contacts.findFirst({
    where: eq(contacts.email, email),
  });

  if (existing?.confirmed) {
    return NextResponse.json({ error: "Email já registado." }, { status: 409 });
  }

  // Cooldown: não reenviar para o mesmo email durante 1 hora
  if (existing && !existing.confirmed) {
    const cooldownUntil = new Date(Date.now() - EMAIL_COOLDOWN);
    const lastSentAt = new Date(existing.tokenExpiresAt.getTime() - 48 * 60 * 60 * 1000);
    if (lastSentAt > cooldownUntil) {
      return NextResponse.json(
        { error: "Email de confirmação já enviado. Verifica a tua caixa de entrada (incluindo spam)." },
        { status: 429 }
      );
    }
  }

  const [contact] = await db
    .insert(contacts)
    .values({ name, email })
    .onConflictDoUpdate({
      target: contacts.email,
      set: {
        name,
        token:          sql`gen_random_uuid()`,
        tokenExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        confirmed:      false,
      },
    })
    .returning();

  const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/contacts/confirm?token=${contact.token}`;

  await resend.emails.send({
    from:    "EatEase <noreply@eatease.eu>",
    to:      email,
    subject: "Confirma o teu registo no EatEase",
    html:    `<p>Olá ${name},</p>
              <p>Clica no link abaixo para confirmar o teu registo (válido 48h):</p>
              <a href="${confirmUrl}">${confirmUrl}</a>`,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
