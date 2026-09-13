import { NextRequest, NextResponse } from "next/server";
import { fail } from "@/lib/apiError";
import { appFunctionHeaders, appFunctionsUrl } from "@/lib/appSupabase";

/**
 * Step 3: the irreversible one. Forwards the caller's own JWT to the app
 * project's `delete-account` edge function.
 *
 * **A proxy, deliberately, and nothing more.** The function reads the account
 * to delete from the `sub` claim of the token and never from the body, so this
 * handler cannot widen what it destroys — and must not look as though it could.
 * There is no body to accept and none is sent.
 *
 * What it buys: the app project's URL and key stay out of the browser, and the
 * failure comes back with a stable code. Called from the browser through
 * `functions.invoke`, a rejection arrived as an opaque `FunctionsHttpError` —
 * on the one step where "it failed" and "it worked" must never be confused.
 *
 * The caller must already have erased the `contacts` row: once the auth user is
 * gone, the token stops resolving and that row is unreachable forever. The
 * order is enforced in `useAccountDeletion`, where both calls are visible
 * together.
 */
export async function POST(req: NextRequest) {
  const functionsUrl = appFunctionsUrl();
  if (!functionsUrl) {
    console.error("[account-deletion/confirm] CONFIG_MISSING_APP_SUPABASE — refusing requests");
    return fail(503, "CONFIG_MISSING_APP_SUPABASE");
  }

  const authorization = req.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";
  if (!token) {
    return fail(401, "UNAUTHORIZED");
  }

  const headers = appFunctionHeaders(token);
  if (!headers) {
    return fail(503, "CONFIG_MISSING_APP_SUPABASE");
  }

  try {
    const res = await fetch(`${functionsUrl}/delete-account`, {
      method: "POST",
      headers,
      body:   "{}",
    });

    if (!res.ok) {
      // The function's own status is the useful part: 401 means the token no
      // longer resolves, 500 means it is misconfigured at that end.
      console.error("[account-deletion/confirm] delete-account answered", res.status, await res.text().catch(() => ""));
      return fail(502, `DELETE_ACCOUNT_FAILED:${res.status}`);
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[account-deletion/confirm] delete-account threw:", err);
    return fail(502, "DELETE_ACCOUNT_FAILED:threw");
  }
}
