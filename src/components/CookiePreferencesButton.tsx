"use client";

interface Props {
  text: string;
}

export function CookiePreferencesButton({ text }: Props) {
  return (
    <button
      type="button"
      onClick={() => {
        // Termly's documented API is displayPreferenceModal (global + on window.Termly).
        // The `termly-display-preferences` class also auto-binds as a fallback.
        if (typeof window.Termly?.displayPreferenceModal === "function") {
          window.Termly.displayPreferenceModal();
        } else if (typeof window.displayPreferenceModal === "function") {
          window.displayPreferenceModal();
        }
      }}
      className="termly-display-preferences text-left text-[14px] text-white/60 transition-colors hover:text-white"
    >
      {text}
    </button>
  );
}
