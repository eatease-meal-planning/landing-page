import { updateSession } from "@/lib/proxy";
import { NextResponse, type NextRequest } from "next/server";
import { locales, detectLocale } from "@/lib/i18n/config";

export async function proxy(request: NextRequest) {
  // 1. Refresh da sessão Supabase
  const supabaseResponse = await updateSession(request);

  // 2. i18n — redireciona para o locale detetado se não tiver locale na URL
  const pathname = request.nextUrl.pathname;
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    const acceptLanguage = request.headers.get("accept-language");
    const locale = detectLocale(acceptLanguage);
    return NextResponse.redirect(
      new URL(`/${locale}${pathname}`, request.url)
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|images|icons|assets).*)"],
};
