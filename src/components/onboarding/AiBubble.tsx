'use client'

import type { ReactNode } from 'react'
import { aiBubbleCls } from './onboarding-constants'

type Props = {
  /** Template / hardcoded copy (preferred for simple bubbles) */
  text?: string
  children?: ReactNode
  className?: string
}

/** PRD §6.1 — AI bubble: elevated bg, asymmetric radius, 17px, max-width ~600px */
export function AiBubble({ text, children, className = '' }: Props) {
  return (
    <div className={`${aiBubbleCls} max-w-[600px] ${className}`.trim()} role="status">
      {text ?? children}
    </div>
  )
}
