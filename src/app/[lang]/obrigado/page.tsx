import Link from "next/link";
import Image from "next/image";

export default async function ObrigadoPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <Image
            src="/assets/eatease-logo-horizontal.svg"
            alt="EatEase"
            width={140}
            height={32}
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </span>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Registo confirmado!
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Bem-vindo ao EatEase. Vais ser dos primeiros a saber quando lançarmos. Obrigado pela confiança!
            </p>
          </div>

          <Link
            href={`/${lang}`}
            className="mt-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
