'use client'

import { useCallback, useRef } from 'react'

export function useLongPress(onLongPress: () => void, ms = 600) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null)

  const start = useCallback(() => {
    if (t.current) clearTimeout(t.current)
    t.current = setTimeout(() => {
      onLongPress()
      t.current = null
    }, ms)
  }, [onLongPress, ms])

  const clear = useCallback(() => {
    if (t.current) {
      clearTimeout(t.current)
      t.current = null
    }
  }, [])

  return {
    onPointerDown: start,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
  }
}
