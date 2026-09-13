import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { fail } from "@/lib/apiError";
import { appSupabaseServer } from "@/lib/appSupabase";

/**
 * Step 2 of self-service deletion: remove the landing-page `contacts` row.
 *
 * **It runs before the app account is destroyed, and the order is not
 * negotiable.** Once the `delete-account` edge function removes the auth user,
 * the `sub` in the JWT stops resolving, `getUser(token)` answers 401, and this
 * row is unreachable for good — the person cannot prove the address is theirs
 * any more either. If this step fails, nothing further may be destroyed.
 *
 * **The address comes from the verified token and never from the body.** A body
 * field would turn a code emailed to one person into a way of erasing anyone's
 * registration. Nothing here is parsed from the request payload at all.
 *
 * No captcha and no rate limit, unlike the endpoints around it: reaching this
 * point already required receiving an emailed code and exchanging it for a JWT,
 * and a limit here could strand someone mid-flow with their account already
 * gone — the one state this design refuses to create.
 */
export async function POST(req: NextRequest) {
  const supabase = appSupabaseServer();
  if (!supabase) {
    return fail(503, "CONFIG_MISSING_APP_SUPABASE");
  }

  const authorization = req.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";
  if (!token) {
    return fail(401, "UNAUTHORIZED");
  }

  let email: string | undefined;
  try {
    // Verifies the token against the app project — the signature, the expiry
    // and that the user still exists.
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      console.info("[account-deletion/registration] token rejected:", error?.message);
      return fail(401, "UNAUTHORIZED");
    }
    email = data.user.email;
  } catch (err) {
    console.error("[account-deletion/registration] token verification threw:", err);
    return fail(401, "UNAUTHORIZED");
  }

  if (!email) {
    // Possible for a phone-only account. Guessing which row to erase from
    // anything else is exactly what this route must never do.
    console.error("[account-deletion/registration] verified token carries no email");
    return fail(400, "TOKEN_WITHOUT_EMAIL");
  }

  let removed: { id: string }[];
  try {
    // Case-insensitive on purpose: /api/contacts stores the address exactly as
    // it was typed, while Supabase hands back a lowercased one, so an exact
    // match would leave "Someone@Example.com" behind and report success. The
    // unique index on email does not serve `lower()`, which costs nothing on a
    // table of this size and is worth revisiting if it ever stops being small.
    removed = await db
      .delete(contacts)
      .where(sql`lower(${contacts.email}) = lower(${email})`)
      .returning({ id: contacts.id });
  } catch (err) {
    // Answering ok here would send the caller on to destroy the app account
    // believing this row was gone, after which nothing can reach it.
    console.error("[account-deletion/registration] contact delete failed:", err);
    return fail(503, "DB_UNAVAILABLE");
  }

  // Idempotent by design: most app users never signed up on the landing page,
  // and a retry after a dropped connection must succeed too.
  return NextResponse.json({ ok: true, removed: removed.length }, { status: 200 });
}
