'use client'

import { useEffect, useState } from 'react'

/** PRD §10.4 — mobile list gestures (match Tailwind md breakpoint) */
export function useIsMobileViewport(maxWidthPx = 768) {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${maxWidthPx}px)`)
    const sync = () => setMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [maxWidthPx])
  return mobile
}
