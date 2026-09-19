import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import Script from "next/script";
import TermlyCMP from '@/components/TermlyCMP'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const WEBSITE_UUID = process.env.TERMLY_UUID!

/**
 * Termly's Auto Blocker rewrites the tags it recognises to `type="text/plain"`
 * and only swaps them back once the visitor has consented to that category. It
 * can only rewrite a tag it has already seen, so this script is `beforeInteractive`
 * and Google Analytics below is `afterInteractive`. The order is the whole of the
 * mechanism: reversed, analytics would run before anyone agreed to it.
 *
 * `autoBlock=on` is half of it — Auto Blocker also has to be enabled for the site
 * in the Termly console. The proof that both halves are in place is the served
 * DOM, where the analytics tag must read `type="text/plain" auto-blocked`.
 */
const TERMLY_SRC = `https://app.termly.io/resource-blocker/${WEBSITE_UUID}?autoBlock=on`

/**
 * Google Analytics 4, website only — the mobile application contains no analytics
 * SDK, so this changes nothing in the Play Data Safety form.
 *
 * Unset means absent: no measurement id, no tag, no requests. That keeps local
 * development and preview deployments out of the reporting, and it is why the
 * privacy notice can describe this in the present tense — the notice ships in the
 * same deploy as the id.
 */
const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID

export const metadata: Metadata = {
  title: "EatEase — Time saved, meals made.",
  description:
    "EatEase plans your family's whole week of meals around the food you actually like, the time you actually have, and the macros you actually need.",
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script src={TERMLY_SRC} strategy="beforeInteractive" />
        <Suspense fallback={null}>
          <TermlyCMP />
        </Suspense>
        {GA_MEASUREMENT_ID && (
          <>
            {/* Blocked by construction, not by ordering. `type="text/plain"` is not
                executed by the browser and not preloaded; Termly swaps it to
                `text/javascript` once the visitor consents to the analytics
                category. That makes the two things I measured stop mattering: the
                `<link rel="preload">` that `next/script` emitted fetched the file
                from Google before consent, and a plain executable tag was hoisted
                by React 19 ABOVE Termly's loader. An inert tag can be hoisted
                anywhere and still cannot run.

                Deliberately NOT `next/script`: it would manage — and execute —
                the tag itself, which is the one thing this must not do. */}
            <script
              type="text/plain"
              data-categories="analytics"
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            {/* This one stays executable on purpose, and it is safe: it defines
                `dataLayer` and queues two entries. It opens no connection and
                writes no cookie — the `_ga` cookie and every request to Google are
                the work of the blocked library above. Blocking it too would risk
                the queue never being replayed, since swapping the type of an
                inline script does not re-run it. */}
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`,
              }}
            />
          </>
        )}
        {children}
      </body>
    </html>
  );
}
