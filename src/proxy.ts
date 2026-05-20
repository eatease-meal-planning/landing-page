import { updateSession } from "@/lib/proxy"
import { NextResponse, type NextRequest } from "next/server"
import { locales, defaultLocale } from "@/lib/i18n/config"

export async function middleware(request: NextRequest) {
  // 1. Refresh da sessão Supabase
  const supabaseResponse = await updateSession(request)

  // 2. i18n — redireciona para o locale por defeito se não tiver locale na URL
  const pathname = request.nextUrl.pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (!pathnameHasLocale) {
    return NextResponse.redirect(
      new URL(`/${defaultLocale}${pathname}`, request.url)
    )
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|images|icons).*)"],
}