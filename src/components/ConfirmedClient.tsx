"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Confetti, type ConfettiRef } from "@/components/ui/confetti";

interface Props {
  title: string;
  body: string;
  backHome: string;
  locale: string;
}

export function ConfirmedClient({ title, body, backHome, locale }: Props) {
  const confettiRef = useRef<ConfettiRef>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      confettiRef.current?.fire({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.55 },
        colors: ["#14b8a6", "#0d9488", "#5eead4", "#ffffff", "#f0fdf4"],
      });
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-secondary px-4 py-16">
      <Confetti
        ref={confettiRef}
        manualstart
        className="pointer-events-none fixed inset-0 z-50 size-full"
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <Image
            src="/assets/eatease-logo-horizontal.svg"
            alt="EatEase"
            width={280}
            height={64}
            priority
          />
        </div>

        <div className="flex flex-col items-center gap-6 rounded-xl bg-card px-8 py-12 text-center shadow-card">
          <span className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="size-8 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </span>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {body}
            </p>
          </div>

          <Link
            href={`/${locale}`}
            className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
