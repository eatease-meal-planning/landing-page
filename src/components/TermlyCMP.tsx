'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

declare global {
  interface Window {
    Termly?: {
      initialize: () => void;
      displayPreferenceModal: () => void;
    };
    displayPreferenceModal?: () => void;
  }
}

/**
 * Re-initialises Termly after a client-side navigation.
 *
 * The script itself is loaded in `layout.tsx` with `beforeInteractive`, which is
 * what puts it ahead of every tag Auto Blocker has to hold back — it can only
 * rewrite a tag it has already seen. Loading it from here, in an effect, put it
 * after hydration, and therefore after the analytics tag it exists to block.
 *
 * What stays here is the part the App Router does need: it never reloads the
 * document, so without this the banner and the blocking state would remain on
 * whichever page the visitor first landed on.
 */
export default function TermlyCMP() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    window.Termly?.initialize()
  }, [pathname, searchParams])

  return null
}
