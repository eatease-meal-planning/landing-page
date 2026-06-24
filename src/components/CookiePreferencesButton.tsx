"use client";

interface Props {
  text: string;
}

export function CookiePreferencesButton({ text }: Props) {
  return (
    <button
      type="button"
      onClick={() => window.Termly?.displayPreferences?.()}
      className="termly-display-preferences text-left text-[14px] text-white/60 transition-colors hover:text-white"
    >
      {text}
    </button>
  );
}
