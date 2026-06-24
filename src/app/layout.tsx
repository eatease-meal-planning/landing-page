import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
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
        <Suspense fallback={null}>
          <TermlyCMP websiteUUID={WEBSITE_UUID} />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
